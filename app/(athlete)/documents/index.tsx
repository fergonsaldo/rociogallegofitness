import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useDocumentStore } from '../../../src/presentation/stores/documentStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Document } from '../../../src/domain/entities/Document';
import { isBlockedExtension } from '../../../src/application/coach/DocumentUseCases';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function AthleteDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { documents, isLoading, isUploading, error, fetchDocuments, uploadDocument, deleteDocument } =
    useDocumentStore();

  const [coachId,   setCoachId]   = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string>('');
  const [noCoach,   setNoCoach]   = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      // Excepción documentada: acceso directo a Supabase para obtener coach asignado
      supabase
        .from('coach_athletes')
        .select('coach_id, users!coach_athletes_coach_id_fkey(full_name)')
        .eq('athlete_id', user.id)
        .limit(1)
        .single()
        .then(({ data, error: err }) => {
          if (err || !data) {
            setNoCoach(true);
            return;
          }
          const cId   = data.coach_id as string;
          const cName = (data.users as any)?.full_name ?? '';
          setCoachId(cId);
          setCoachName(cName);
          fetchDocuments(cId, user.id);
        });
    }, [user?.id]),
  );

  const handleUpload = async () => {
    if (!coachId || !user?.id) return;

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const name  = asset.name;

    if (isBlockedExtension(name)) {
      Alert.alert('Error', Strings.docBlockedExtension);
      return;
    }

    await uploadDocument(
      coachId,
      user.id,
      user.id,
      name,
      asset.uri,
      asset.mimeType ?? 'application/octet-stream',
    );
  };

  const handleOpen = (doc: Document) => {
    if (!doc.downloadUrl) return;
    Linking.openURL(doc.downloadUrl);
  };

  const handleDelete = (doc: Document) => {
    Alert.alert(
      Strings.docDeleteTitle,
      Strings.docDeleteMessage(doc.name),
      [
        { text: Strings.docDeleteCancel, style: 'cancel' },
        {
          text: Strings.docDeleteConfirm,
          style: 'destructive',
          onPress: () => deleteDocument(doc),
        },
      ],
    );
  };

  if (noCoach) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{Strings.docTitle}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{Strings.docNoCoachAssigned}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{Strings.docTitle}</Text>
            {coachName ? <Text style={styles.subtitle}>{coachName}</Text> : null}
          </View>
          <TouchableOpacity
            style={[styles.uploadButton, (isUploading || !coachId) && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading || !coachId}
          >
            {isUploading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.uploadButtonText}>{Strings.docUploadButton}</Text>
            }
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.athlete} size="large" />
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📁</Text>
            <Text style={styles.emptyTitle}>{Strings.docEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.docEmptySubtitleAthlete}</Text>
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <DocumentCard
                doc={item}
                isOwn={item.uploadedBy === user?.id}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── DocumentCard ───────────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc:      Document;
  isOwn:    boolean;
  onOpen:   (d: Document) => void;
  onDelete: (d: Document) => void;
}

function DocumentCard({ doc, isOwn, onOpen, onDelete }: DocumentCardProps) {
  const ext     = doc.name.split('.').pop()?.toUpperCase() ?? 'FILE';
  const sizeKb  = Math.round(doc.fileSize / 1024);
  const dateStr = doc.createdAt.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>{ext}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={2}>{doc.name}</Text>
        <Text style={styles.cardMeta}>{Strings.docSizeLabel(sizeKb)} · {dateStr}</Text>
      </View>
      <View style={styles.cardActions}>
        {doc.downloadUrl && (
          <TouchableOpacity style={styles.openButton} onPress={() => onOpen(doc)}>
            <Text style={styles.openButtonText}>{Strings.docOpenButton}</Text>
          </TouchableOpacity>
        )}
        {isOwn && (
          <TouchableOpacity
            onPress={() => onDelete(doc)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { minWidth: 70 },
  backText:     { color: Colors.athlete, fontSize: FontSize.md, minWidth: 70 },
  title:        { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  subtitle:     { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  uploadButton: {
    backgroundColor: Colors.athlete, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    minWidth: 70, alignItems: 'center',
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  uploadButtonDisabled: { opacity: 0.6 },
  uploadButtonText:     { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  list: { gap: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.athlete}15`, alignItems: 'center', justifyContent: 'center',
  },
  cardIconText: { fontSize: 9, fontWeight: '800', color: Colors.athlete, letterSpacing: 0.5 },
  cardContent:  { flex: 1 },
  cardName:     { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  cardMeta:     { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  openButton: {
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.athlete,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  openButtonText: { color: Colors.athlete, fontSize: FontSize.xs, fontWeight: '700' },
  deleteIcon:     { fontSize: 18 },
});
