import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useTagStore } from '../../../src/presentation/stores/tagStore';
import { useTagAutomationStore } from '../../../src/presentation/stores/tagAutomationStore';
import { ClientTag } from '../../../src/domain/entities/ClientTag';

const PRESET_COLORS = [
  '#C90960', '#DC2626', '#D97706', '#059669',
  '#0891B2', '#7C3AED', '#DB2777', '#6B7280',
  '#1D4ED8', '#065F46', '#92400E', '#1E3A5F',
];

// ── TagFormModal ───────────────────────────────────────────────────────────────

function TagFormModal({
  visible,
  editing,
  onClose,
  onSubmit,
}: {
  visible:  boolean;
  editing:  ClientTag | null;
  onClose:  () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
}) {
  const [name,       setName]       = useState(editing?.name  ?? '');
  const [color,      setColor]      = useState(editing?.color ?? PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  // Sync state when editing changes
  const reset = useCallback(() => {
    setName(editing?.name  ?? '');
    setColor(editing?.color ?? PRESET_COLORS[0]);
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
            {editing ? Strings.tagFormEditTitle : Strings.tagFormCreateTitle}
          </Text>

          <Text style={styles.fieldLabel}>{Strings.tagFormNameLabel}</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder={Strings.tagFormNamePlaceholder}
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
            {Strings.tagFormColorLabel}
          </Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  color === c && styles.colorSwatchSelected,
                ]}
                onPress={() => setColor(c)}
                activeOpacity={0.8}
              />
            ))}
          </View>

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>{Strings.tagFormCancel}</Text>
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
                    {editing ? Strings.tagFormSubmitEdit : Strings.tagFormSubmitCreate}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── TagRow ─────────────────────────────────────────────────────────────────────

function TagRow({
  tag,
  hasAutomation,
  onEdit,
  onDelete,
  onConfigure,
}: {
  tag:            ClientTag;
  hasAutomation:  boolean;
  onEdit:         (tag: ClientTag) => void;
  onDelete:       (tag: ClientTag) => void;
  onConfigure:    (tag: ClientTag) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.colorDot, { backgroundColor: tag.color }]} />
      <View style={styles.rowInfo}>
        <Text style={styles.tagName}>{tag.name}</Text>
        <Text style={styles.tagMeta}>
          {Strings.tagClients(tag.clientCount)}
          {'  ·  '}
          {hasAutomation ? Strings.tagHasAutomation : Strings.tagNoAutomations}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, hasAutomation && styles.actionBtnActive]}
          onPress={() => onConfigure(tag)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>⚙</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(tag)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDestructive]}
          onPress={() => onDelete(tag)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function TagsScreen() {
  const router                           = useRouter();
  const { user }                         = useAuthStore();
  const { tags, isLoading, error,
          fetchTags, createTag,
          updateTag, deleteTag,
          clearError }                   = useTagStore();
  const { automations, fetchAutomation } = useTagAutomationStore();

  const [formVisible, setFormVisible]   = useState(false);
  const [editingTag,  setEditingTag]    = useState<ClientTag | null>(null);

  useFocusEffect(useCallback(() => {
    if (!user?.id) return;
    fetchTags(user.id).then(() => {
      // Eagerly fetch automations for all tags so the list shows the right state
      tags.forEach((t) => {
        if (automations[t.id] === undefined) fetchAutomation(t.id);
      });
    });
  }, [user?.id]));

  const openCreate = () => {
    setEditingTag(null);
    setFormVisible(true);
  };

  const openEdit = (tag: ClientTag) => {
    setEditingTag(tag);
    setFormVisible(true);
  };

  const openAutomation = (tag: ClientTag) => {
    router.push(`/(coach)/clients/tag-automation?id=${tag.id}&name=${encodeURIComponent(tag.name)}`);
  };

  const handleSubmit = async (name: string, color: string) => {
    if (editingTag) {
      await updateTag(editingTag.id, { name, color });
    } else {
      await createTag({ coachId: user!.id, name, color });
    }
  };

  const handleDelete = (tag: ClientTag) => {
    Alert.alert(
      Strings.alertDeleteTagTitle,
      Strings.alertDeleteTagMessage(tag.name, tag.clientCount),
      [
        { text: Strings.alertDeleteTagCancel, style: 'cancel' },
        {
          text: Strings.alertDeleteTagConfirm,
          style: 'destructive',
          onPress: () => deleteTag(tag.id),
        },
      ],
    );
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.tagsTitle}</Text>
          <Text style={styles.subtitle}>{Strings.tagsSubtitle(tags.length)}</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={openCreate} activeOpacity={0.8}>
          <Text style={styles.newButtonText}>{Strings.tagsNewButton}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : tags.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏷️</Text>
          <Text style={styles.emptyText}>{Strings.tagsEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.tagsEmptySubtitle}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {tags.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              hasAutomation={!!automations[tag.id]}
              onEdit={openEdit}
              onDelete={handleDelete}
              onConfigure={openAutomation}
            />
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      <TagFormModal
        visible={formVisible}
        editing={editingTag}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                 { flex: 1, backgroundColor: Colors.background },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:                { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:             { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  newButton:            { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  newButtonText:        { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  center:               { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:           { fontSize: 40 },
  emptyText:            { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle:        { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  errorText:            { fontSize: FontSize.md, color: Colors.error, textAlign: 'center' },
  retryBtn:             { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  retryBtnText:         { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  list:                 { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },

  // Row
  row:                  { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  colorDot:             { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
  rowInfo:              { flex: 1, gap: 2 },
  tagName:              { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  tagMeta:              { fontSize: FontSize.xs, color: Colors.textMuted },
  rowActions:           { flexDirection: 'row', gap: Spacing.xs },
  actionBtn:            { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  actionBtnDestructive: { backgroundColor: `${Colors.error}10`, borderColor: `${Colors.error}30` },
  actionBtnActive:      { backgroundColor: `${Colors.primary}15`, borderColor: `${Colors.primary}50` },
  actionBtnText:        { fontSize: 14 },

  // Modal
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:                { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  sheetTitle:           { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  fieldLabel:           { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  nameInput:            { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  colorGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 4 },
  colorSwatch:          { width: 36, height: 36, borderRadius: 18 },
  colorSwatchSelected:  { borderWidth: 3, borderColor: Colors.textPrimary },
  sheetActions:         { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn:            { flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelBtnText:        { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  submitBtn:            { flex: 2, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', backgroundColor: Colors.primary },
  submitBtnDisabled:    { opacity: 0.5 },
  submitBtnText:        { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
