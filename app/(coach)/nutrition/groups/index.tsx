import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNutritionStore } from '../../../../src/presentation/stores/nutritionStore';
import { useAuthStore } from '../../../../src/presentation/stores/authStore';
import { PlanGroup } from '../../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../../src/shared/constants/theme';
import { Strings } from '../../../../src/shared/constants/strings';

export default function PlanGroupsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    groups, groupsLoading, isSubmitting, error,
    fetchGroups, createGroup, deleteGroup, clearError,
  } = useNutritionStore();

  const [query,       setQuery]       = useState('');
  const [showCreate,  setShowCreate]  = useState(false);
  const [newName,     setNewName]     = useState('');
  const [newDesc,     setNewDesc]     = useState('');

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchGroups(user.id);
    }, [user?.id]),
  );

  const filtered = query.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase().trim()))
    : groups;

  const handleCreate = async () => {
    if (!newName.trim() || !user?.id) return;
    const ok = await createGroup(user.id, newName.trim(), newDesc.trim() || undefined);
    if (ok) {
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    }
  };

  const handleDelete = (group: PlanGroup) => {
    Alert.alert(
      Strings.planGroupDeleteTitle,
      Strings.planGroupDeleteMessage(group.name),
      [
        { text: Strings.planGroupDeleteCancel, style: 'cancel' },
        { text: Strings.planGroupDeleteConfirm, style: 'destructive', onPress: () => deleteGroup(group.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>{Strings.planGroupTitle}</Text>
              <Text style={styles.subtitle}>{Strings.planGroupSubtitle(groups.length)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreate(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>{Strings.planGroupNewButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.planGroupSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Error */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {groupsLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📂</Text>
                <Text style={styles.emptyTitle}>{Strings.planGroupEmptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{Strings.planGroupEmptySubtitle}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <GroupCard
                group={item}
                onPress={() => router.push(`/(coach)/nutrition/groups/${item.id}` as any)}
                onDelete={() => handleDelete(item)}
              />
            )}
          />
        )}
      </View>

      {/* Modal crear agrupación */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{Strings.planGroupCreateTitle}</Text>

            <Text style={styles.fieldLabel}>{Strings.planGroupNameLabel}</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder={Strings.planGroupNamePlaceholder}
              placeholderTextColor={Colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>{Strings.planGroupDescriptionLabel}</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMultiline]}
              placeholder={Strings.planGroupDescriptionPlaceholder}
              placeholderTextColor={Colors.textSecondary}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitButton, (!newName.trim() || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleCreate}
              disabled={!newName.trim() || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitButtonText}>{Strings.planGroupCreateButton}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{Strings.planGroupDeleteCancel}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function GroupCard({
  group,
  onPress,
  onDelete,
}: {
  group: PlanGroup;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{group.name}</Text>
        {!!group.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>{group.description}</Text>
        )}
        <Text style={styles.cardCount}>{Strings.planGroupPlanCount(group.planCount)}</Text>
      </View>
      <TouchableOpacity style={styles.cardDelete} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.cardDeleteText}>🗑</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  container:        { flex: 1, paddingHorizontal: Spacing.md },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  accentBar:        { width: 4, height: 36, backgroundColor: Colors.primary, borderRadius: 2 },
  title:            { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  subtitle:         { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  createButton:     { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: FontSize.sm },
  searchInput:      { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.sm },
  errorBanner:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  errorText:        { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  errorDismiss:     { color: Colors.error, fontWeight: '700', marginLeft: Spacing.sm },
  loader:           { marginTop: Spacing.xl },
  listContent:      { paddingBottom: Spacing.xl },
  emptyContainer:   { flex: 1 },
  emptyState:       { alignItems: 'center', paddingTop: Spacing.xl * 2 },
  emptyEmoji:       { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle:       { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  emptySubtitle:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  card:             { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  cardBody:         { flex: 1 },
  cardName:         { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  cardDescription:  { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  cardCount:        { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '500' },
  cardDelete:       { padding: Spacing.xs },
  cardDeleteText:   { fontSize: 18 },
  modalSafe:        { flex: 1, backgroundColor: Colors.background },
  modalContainer:   { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  modalTitle:       { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  fieldLabel:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  fieldInput:       { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.md },
  fieldInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  submitButton:     { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  cancelButton:     { paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  cancelButtonText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
