import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useAthleteGroupStore } from '../../../src/presentation/stores/athleteGroupStore';
import { AthleteGroup } from '../../../src/domain/entities/AthleteGroup';

// ── GroupFormModal ─────────────────────────────────────────────────────────────

function GroupFormModal({
  visible,
  editing,
  onClose,
  onSubmit,
}: {
  visible:  boolean;
  editing:  AthleteGroup | null;
  onClose:  () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}) {
  const [name,        setName]        = useState(editing?.name        ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [submitting,  setSubmitting]  = useState(false);

  const reset = useCallback(() => {
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setSubmitting(false);
  }, [editing]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={reset} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {editing ? Strings.groupFormEditTitle : Strings.groupFormCreateTitle}
          </Text>

          <Text style={styles.fieldLabel}>{Strings.groupFormNameLabel}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={Strings.groupFormNamePlaceholder}
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>
            {Strings.groupFormDescLabel}
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder={Strings.groupFormDescPlaceholder}
            placeholderTextColor={Colors.textMuted}
            maxLength={300}
            multiline
            numberOfLines={3}
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>{Strings.groupFormCancel}</Text>
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
                    {editing ? Strings.groupFormSubmitEdit : Strings.groupFormSubmitCreate}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── GroupRow ───────────────────────────────────────────────────────────────────

function GroupRow({
  group,
  onEdit,
  onDelete,
  onOpen,
}: {
  group:    AthleteGroup;
  onEdit:   (group: AthleteGroup) => void;
  onDelete: (group: AthleteGroup) => void;
  onOpen:   (group: AthleteGroup) => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onOpen(group)} activeOpacity={0.8}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>👥</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.groupMeta}>{Strings.groupMembers(group.memberCount)}</Text>
        {!!group.description && (
          <Text style={styles.groupDesc} numberOfLines={1}>{group.description}</Text>
        )}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(group)} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDestructive]}
          onPress={() => onDelete(group)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function GroupsScreen() {
  const router                                    = useRouter();
  const { user }                                  = useAuthStore();
  const { groups, isLoading, error,
          fetchGroups, createGroup,
          updateGroup, deleteGroup,
          clearError }                            = useAthleteGroupStore();

  const [formVisible, setFormVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AthleteGroup | null>(null);

  useFocusEffect(useCallback(() => {
    if (user?.id) fetchGroups(user.id);
  }, [user?.id]));

  const openCreate = () => {
    setEditingGroup(null);
    setFormVisible(true);
  };

  const openEdit = (group: AthleteGroup) => {
    setEditingGroup(group);
    setFormVisible(true);
  };

  const openDetail = (group: AthleteGroup) => {
    router.push(`/(coach)/clients/group-detail?id=${group.id}&name=${encodeURIComponent(group.name)}`);
  };

  const handleSubmit = async (name: string, description: string) => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, { name, description: description || null });
    } else {
      await createGroup({ coachId: user!.id, name, description: description || null });
    }
  };

  const handleDelete = (group: AthleteGroup) => {
    Alert.alert(
      Strings.groupDeleteTitle,
      Strings.groupDeleteMessage(group.name),
      [
        { text: Strings.groupDeleteCancel, style: 'cancel' },
        {
          text: Strings.groupDeleteConfirm,
          style: 'destructive',
          onPress: () => deleteGroup(group.id),
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.groupsTitle}</Text>
          <Text style={styles.subtitle}>{Strings.groupsSubtitle(groups.length)}</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={openCreate} activeOpacity={0.8}>
          <Text style={styles.newButtonText}>{Strings.groupsNewButton}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>{Strings.groupsEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.groupsEmptySubtitle}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              onEdit={openEdit}
              onDelete={handleDelete}
              onOpen={openDetail}
            />
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      <GroupFormModal
        visible={formVisible}
        editing={editingGroup}
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
  rowIcon:              { width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowIconText:          { fontSize: 18 },
  rowInfo:              { flex: 1, gap: 2 },
  groupName:            { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  groupMeta:            { fontSize: FontSize.xs, color: Colors.textMuted },
  groupDesc:            { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  rowActions:           { flexDirection: 'row', gap: Spacing.xs },
  actionBtn:            { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  actionBtnDestructive: { backgroundColor: `${Colors.error}10`, borderColor: `${Colors.error}30` },
  actionBtnText:        { fontSize: 14 },

  // Modal
  overlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:                { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  sheetTitle:           { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  fieldLabel:           { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  input:                { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginTop: 4 },
  inputMultiline:       { height: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
  sheetActions:         { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancelBtn:            { flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelBtnText:        { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  submitBtn:            { flex: 2, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', backgroundColor: Colors.primary },
  submitBtnDisabled:    { opacity: 0.5 },
  submitBtnText:        { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
