import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, FlatList, Modal,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useAthleteGroupStore } from '../../../src/presentation/stores/athleteGroupStore';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AthleteSummary {
  id:        string;
  full_name: string;
  email:     string;
}

// ── AddMembersModal ───────────────────────────────────────────────────────────

function AddMembersModal({
  visible,
  allAthletes,
  currentMemberIds,
  onAdd,
  onClose,
}: {
  visible:          boolean;
  allAthletes:      AthleteSummary[];
  currentMemberIds: string[];
  onAdd:            (athlete: AthleteSummary) => Promise<void>;
  onClose:          () => void;
}) {
  const [adding, setAdding] = useState<string | null>(null);

  const available = allAthletes.filter((a) => !currentMemberIds.includes(a.id));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{Strings.groupAddAthleteTitle}</Text>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{Strings.groupAddAthletePickerDone}</Text>
            </TouchableOpacity>
          </View>

          {available.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>{Strings.groupAddAthleteEmpty}</Text>
            </View>
          ) : (
            <FlatList
              data={available}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={async () => {
                    if (adding) return;
                    setAdding(item.id);
                    try { await onAdd(item); } finally { setAdding(null); }
                  }}
                  activeOpacity={0.75}
                  disabled={!!adding}
                >
                  <View style={styles.pickerRowInfo}>
                    <Text style={styles.pickerRowName}>{item.full_name}</Text>
                    <Text style={styles.pickerRowEmail}>{item.email}</Text>
                  </View>
                  {adding === item.id
                    ? <ActivityIndicator size="small" color={Colors.primary} />
                    : <Text style={styles.pickerRowAdd}>+</Text>
                  }
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: Spacing.xxl }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { user } = useAuthStore();
  const { id: groupId, name: groupName } = useLocalSearchParams<{ id: string; name: string }>();

  const { members, fetchMembers, addMember, removeMember, error } = useAthleteGroupStore();

  const memberIds = members[groupId] ?? [];

  const [allAthletes,     setAllAthletes]     = useState<AthleteSummary[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(true);
  const [showAddModal,    setShowAddModal]    = useState(false);

  // Load members on focus
  useFocusEffect(useCallback(() => {
    fetchMembers(groupId);
  }, [groupId]));

  // Load all coach athletes once
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('coach_athletes')
      .select('users!coach_athletes_athlete_id_fkey(id, full_name, email)')
      .eq('coach_id', user.id)
      .eq('status', 'active')
      .then(({ data }) => {
        setAllAthletes(
          (data ?? []).map((r: any) => ({
            id:        r.users.id,
            full_name: r.users.full_name,
            email:     r.users.email,
          })),
        );
      })
      .finally(() => setAthletesLoading(false));
  }, [user?.id]);

  const memberAthletes = allAthletes.filter((a) => memberIds.includes(a.id));

  const handleRemove = (athlete: AthleteSummary) => {
    Alert.alert(
      Strings.groupDetailRemove,
      `¿Quitar a ${athlete.full_name} del grupo?`,
      [
        { text: Strings.groupDeleteCancel, style: 'cancel' },
        {
          text: Strings.groupDetailRemove,
          style: 'destructive',
          onPress: () => removeMember(groupId, athlete.id),
        },
      ],
    );
  };

  const isLoading = athletesLoading && memberIds.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{decodeURIComponent(groupName ?? '')}</Text>
          <Text style={styles.subtitle}>{Strings.groupMembers(memberIds.length)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>{Strings.groupDetailAddMembers}</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : memberAthletes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyText}>{Strings.groupDetailEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.groupDetailEmptySubtitle}</Text>
        </View>
      ) : (
        <FlatList
          data={memberAthletes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>
                  {item.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.full_name}</Text>
                <Text style={styles.rowEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <AddMembersModal
        visible={showAddModal}
        allAthletes={allAthletes}
        currentMemberIds={memberIds}
        onAdd={async (athlete) => {
          await addMember(groupId, athlete.id);
        }}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:            { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:         { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  addBtn:           { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText:       { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:       { fontSize: 40 },
  emptyText:        { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle:    { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  errorBanner:      { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: `${Colors.error}15`, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.error}30` },
  errorBannerText:  { fontSize: FontSize.sm, color: Colors.error },
  list:             { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm, paddingBottom: Spacing.xxl },

  // Member row
  row:              { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  rowAvatar:        { width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.primary}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowAvatarText:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  rowInfo:          { flex: 1 },
  rowName:          { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  rowEmail:         { fontSize: FontSize.xs, color: Colors.textMuted },
  removeBtn:        { width: 30, height: 30, borderRadius: 15, backgroundColor: `${Colors.error}10`, borderWidth: 1, borderColor: `${Colors.error}30`, alignItems: 'center', justifyContent: 'center' },
  removeBtnText:    { fontSize: FontSize.sm, color: Colors.error, fontWeight: '700' },

  // Add members modal
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet:      { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '65%', paddingBottom: Spacing.xxl },
  pickerHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerTitle:      { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  doneBtn:          { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  doneBtnText:      { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  pickerRow:        { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  pickerRowInfo:    { flex: 1 },
  pickerRowName:    { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  pickerRowEmail:   { fontSize: FontSize.xs, color: Colors.textMuted },
  pickerRowAdd:     { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700', width: 24, textAlign: 'center' },
  pickerEmpty:      { padding: Spacing.xl, alignItems: 'center' },
  pickerEmptyText:  { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
});
