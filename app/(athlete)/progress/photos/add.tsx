import {
  View, Text, TouchableOpacity, Image,
  ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TextInput,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../../src/presentation/stores/authStore';
import { useProgressPhotoStore } from '../../../../src/presentation/stores/progressPhotoStore';
import { PHOTO_TAGS, PHOTO_TAG_LABELS, PhotoTag } from '../../../../src/domain/entities/ProgressPhoto';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../src/shared/constants/theme';
import { Strings } from '../../../../src/shared/constants/strings';

export default function AddProgressPhotoScreen() {
  const router                          = useRouter();
  const { user }                        = useAuthStore();
  const { isUploading, upload }         = useProgressPhotoStore();

  const [localUri, setLocalUri]         = useState<string | null>(null);
  const [tag, setTag]                   = useState<PhotoTag>('front');
  const [notes, setNotes]               = useState('');
  const [tagError, setTagError]         = useState<string | null>(null);
  const [imageError, setImageError]     = useState<string | null>(null);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setImageError('Permiso de galería denegado. Actívalo en Ajustes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.8,
      aspect:     [3, 4],
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalUri(result.assets[0].uri);
      setImageError(null);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!localUri) { setImageError('Selecciona una foto'); return; }

    const saved = await upload(
      { athleteId: user.id, takenAt: new Date(), tag, notes: notes.trim() || undefined, storagePath: '' },
      localUri,
    );
    if (saved) router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{Strings.progressPhotosAdd}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Selector de imagen */}
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.8}>
          {localUri ? (
            <Image source={{ uri: localUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Toca para seleccionar foto</Text>
            </View>
          )}
        </TouchableOpacity>
        {imageError && <Text style={styles.errorText}>{imageError}</Text>}

        {/* Posición */}
        <View style={styles.field}>
          <Text style={styles.label}>{Strings.progressPhotoTag} <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipRow}>
            {PHOTO_TAGS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, tag === t && styles.chipActive]}
                onPress={() => { setTag(t); setTagError(null); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>
                  {PHOTO_TAG_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tagError && <Text style={styles.errorText}>{tagError}</Text>}
        </View>

        {/* Notas */}
        <View style={styles.field}>
          <Text style={styles.label}>{Strings.progressPhotoNotes}</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas opcionales…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (isUploading || !localUri) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isUploading || !localUri}
          activeOpacity={0.8}
        >
          {isUploading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveButtonText}>{Strings.progressPhotoSave}</Text>
          }
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', width: 60 },
  title:   { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  imagePicker: { borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', aspectRatio: 0.75, backgroundColor: Colors.surfaceMuted },
  preview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  imagePlaceholderIcon: { fontSize: 48 },
  imagePlaceholderText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  field:    { gap: Spacing.xs },
  label:    { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  required: { color: Colors.error },
  chipRow:  { flexDirection: 'row', gap: Spacing.sm },
  chip:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.athleteSubtle, borderColor: Colors.athlete },
  chipText:   { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.athlete },
  notesInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, minHeight: 80, paddingTop: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  errorText:  { fontSize: FontSize.xs, color: Colors.error },
  saveButton: { backgroundColor: Colors.athlete, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
