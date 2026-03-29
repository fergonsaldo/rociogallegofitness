import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, FlatList,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ColorPicker, fromHsv } from 'react-native-color-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useSessionTypeStore } from '../../../src/presentation/stores/sessionTypeStore';
import { SessionType } from '../../../src/domain/entities/SessionType';

// ── SessionTypeFormModal ───────────────────────────────────────────────────────

function SessionTypeFormModal({
  visible,
  editing,
  onClose,
  onSubmit,
}: {
  visible:  boolean;
  editing:  SessionType | null;
  onClose:  () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}) {
  const [name,       setName]       = useState(editing?.name  ?? '');
  const [color,      setColor]      = useState(editing?.color ?? '#6B7280');
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setName(editing?.name  ?? '');
    setColor(editing?.color ?? '#6B7280');
    setSubmitting(false);
  }, [editing]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), color);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={reset}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {editing ? Strings.sessionTypeFormEditTitle : Strings.sessionTypeFormCreateTitle}
          </Text>

          <Text style={styles.fieldLabel}>{Strings.sessionTypeFormNameLabel}</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder={Strings.sessionTypeFormNamePlaceholder}
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
            {Strings.sessionTypeFormColorLabel}
          </Text>
          <View style={styles.colorPreviewRow}>
            <View style={[styles.colorPreviewSwatch, { backgroundColor: color }]} />
            <Text style={styles.colorHexLabel}>{color.toUpperCase()}</Text>
          </View>
          <ColorPicker
            color={color}
            onColorChange={(hsv) => setColor(fromHsv(hsv))}
            style={styles.colorPicker}
            hideSliders={false}
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>{Strings.sessionTypeFormCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (!name.trim() || submitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!name.trim() || submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>
                    {editing ? Strings.sessionTypeFormSubmitEdit : Strings.sessionTypeFormSubmitCreate}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── SubstituteModal ─────────────────────────────────────────────────────────────

function SubstituteModal({
  visible,
  deletingType,
  sessionTypes,
  usageCount,
  onClose,
  onConfirm,
}: {
  visible:      boolean;
  deletingType: SessionType | null;
  sessionTypes: SessionType[];
  usageCount:   number;
  onClose:      () => void;
  onConfirm:    (substitutionId: string) => Promise<void>;
}) {
  const [selected,   setSelected]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const candidates = sessionTypes.filter((t) => t.id !== deletingType?.id);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onConfirm(selected);
      onClose();
    } finally {
      setSubmitting(false);
      setSelected(null);
    }
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{Strings.substituteSessionTypeTitle}</Text>
          {deletingType && (
            <Text style={styles.substituteMessage}>
              {Strings.substituteSessionTypeMessage(deletingType.name, usageCount)}
            </Text>
          )}

          <FlatList
            data={candidates}
            keyExtractor={(item) => item.id}
            style={styles.substituteList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.substituteRow, selected === item.id && styles.substituteRowSelected]}
                onPress={() => setSelected(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.substituteRowName}>{item.name}</Text>
                {selected === item.id && (
                  <Text style={styles.substituteCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.substituteEmpty}>{Strings.substituteSessionTypePlaceholder}</Text>
            }
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>{Strings.substituteSessionTypeCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, styles.submitBtnDestructive, (!selected || submitting) && styles.submitBtnDisabled]}
              onPress={handleConfirm}
              disabled={!selected || submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitBtnText}>{Strings.substituteSessionTypeConfirm}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── SessionTypeRow ─────────────────────────────────────────────────────────────

function SessionTypeRow({
  sessionType,
  onEdit,
  onDelete,
}: {
  sessionType: SessionType;
  onEdit:      (sessionType: SessionType) => void;
  onDelete:    (sessionType: SessionType) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.colorDot, { backgroundColor: sessionType.color }]} />
      <View style={styles.rowInfo}>
        <Text style={styles.typeName}>{sessionType.name}</Text>
        <Text style={styles.typeMeta}>
          {sessionType.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(sessionType)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDestructive]}
          onPress={() => onDelete(sessionType)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SessionTypesScreen() {
  const { user }                = useAuthStore();
  const {
    sessionTypes, isLoading, error,
    fetchSessionTypes, createSessionType,
    updateSessionType, deleteSessionType,
    getSessionTypeUsageCount, deleteSessionTypeWithSubstitution,
    clearError,
  } = useSessionTypeStore();

  const [formVisible,      setFormVisible]      = useState(false);
  const [editingType,      setEditingType]      = useState<SessionType | null>(null);
  const [substituteVisible, setSubstituteVisible] = useState(false);
  const [deletingType,     setDeletingType]     = useState<SessionType | null>(null);
  const [usageCount,       setUsageCount]       = useState(0);

  useFocusEffect(useCallback(() => {
    if (user?.id) fetchSessionTypes(user.id);
  }, [user?.id]));

  const openCreate = () => {
    setEditingType(null);
    setFormVisible(true);
  };

  const openEdit = (sessionType: SessionType) => {
    setEditingType(sessionType);
    setFormVisible(true);
  };

  const handleSubmit = async (name: string, color: string) => {
    if (editingType) {
      await updateSessionType(editingType.id, { name, color });
    } else {
      await createSessionType({ coachId: user!.id, name, color });
    }
  };

  const handleDelete = async (sessionType: SessionType) => {
    const count = await getSessionTypeUsageCount(sessionType.id);

    if (count === 0) {
      Alert.alert(
        Strings.alertDeleteSessionTypeTitle,
        Strings.alertDeleteSessionTypeMessage(sessionType.name),
        [
          { text: Strings.alertDeleteSessionTypeCancel, style: 'cancel' },
          {
            text: Strings.alertDeleteSessionTypeConfirm,
            style: 'destructive',
            onPress: () => deleteSessionType(sessionType.id),
          },
        ],
      );
    } else {
      setDeletingType(sessionType);
      setUsageCount(count);
      setSubstituteVisible(true);
    }
  };

  const handleSubstituteConfirm = async (substitutionId: string) => {
    if (!deletingType) return;
    await deleteSessionTypeWithSubstitution(deletingType.id, substitutionId);
    setDeletingType(null);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.sessionTypesTitle}</Text>
          <Text style={styles.subtitle}>{Strings.sessionTypesSubtitle(sessionTypes.length)}</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={openCreate} activeOpacity={0.8}>
          <Text style={styles.newButtonText}>{Strings.sessionTypesNewButton}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : sessionTypes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🗂️</Text>
          <Text style={styles.emptyText}>{Strings.sessionTypesEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.sessionTypesEmptySubtitle}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {sessionTypes.map((st) => (
            <SessionTypeRow
              key={st.id}
              sessionType={st}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      <SessionTypeFormModal
        visible={formVisible}
        editing={editingType}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />

      <SubstituteModal
        visible={substituteVisible}
        deletingType={deletingType}
        sessionTypes={sessionTypes}
        usageCount={usageCount}
        onClose={() => { setSubstituteVisible(false); setDeletingType(null); }}
        onConfirm={handleSubstituteConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                  { flex: 1, backgroundColor: Colors.background },
  header:                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:                 { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:              { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  newButton:             { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  newButtonText:         { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  center:                { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:            { fontSize: 40 },
  emptyText:             { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle:         { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  errorText:             { fontSize: FontSize.md, color: Colors.error, textAlign: 'center' },
  retryBtn:              { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  retryBtnText:          { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  list:                  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },

  // Row
  row:                   { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  colorDot:              { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
  rowInfo:               { flex: 1, gap: 2 },
  typeName:              { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  typeMeta:              { fontSize: FontSize.xs, color: Colors.textMuted },
  rowActions:            { flexDirection: 'row', gap: Spacing.xs },
  actionBtn:             { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  actionBtnDestructive:  { backgroundColor: `${Colors.error}10`, borderColor: `${Colors.error}30` },
  actionBtnText:         { fontSize: 14 },

  // Modal shared
  overlay:               { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:                 { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  sheetTitle:            { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  fieldLabel:            { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  nameInput:             { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  sheetActions:          { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn:             { flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelBtnText:         { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  submitBtn:             { flex: 2, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', backgroundColor: Colors.primary },
  submitBtnDestructive:  { backgroundColor: Colors.error },
  submitBtnDisabled:     { opacity: 0.5 },
  submitBtnText:         { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  // Color picker
  colorPreviewRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  colorPreviewSwatch:    { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  colorHexLabel:         { fontSize: FontSize.sm, color: Colors.textSecondary, fontVariant: ['tabular-nums'] },
  colorPicker:           { height: 220, marginTop: Spacing.sm },

  // Substitute modal
  substituteMessage:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  substituteList:        { maxHeight: 200 },
  substituteRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  substituteRowSelected: { borderColor: Colors.primary, backgroundColor: `${Colors.primary}10` },
  substituteRowName:     { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  substituteCheck:       { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  substituteEmpty:       { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.md },
});
