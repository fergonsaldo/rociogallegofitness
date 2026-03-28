import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, FlatList, Modal, ScrollView,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useAthleteGroupStore } from '../../../src/presentation/stores/athleteGroupStore';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useCardioStore } from '../../../src/presentation/stores/cardioStore';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AthleteSummary {
  id:        string;
  full_name: string;
  email:     string;
}

interface PickerItem {
  id:   string;
  name: string;
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

// ── ContentPickerModal ────────────────────────────────────────────────────────

function ContentPickerModal({
  visible,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  visible:    boolean;
  items:      PickerItem[];
  selectedId: string | null;
  onSelect:   (item: PickerItem | null) => void;
  onClose:    () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{Strings.groupAssignTitle}</Text>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>{Strings.groupAddAthletePickerDone}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.pickerRow, selectedId === null && styles.pickerRowSelected]}
            onPress={() => { onSelect(null); onClose(); }}
            activeOpacity={0.75}
          >
            <View style={styles.pickerRowInfo}>
              <Text style={[styles.pickerRowName, selectedId === null && styles.pickerRowNameSelected]}>
                {Strings.groupAssignNone}
              </Text>
            </View>
            {selectedId === null && <Text style={styles.pickerCheck}>✓</Text>}
          </TouchableOpacity>

          {items.length === 0 ? (
            <View style={styles.pickerEmpty}>
              <Text style={styles.pickerEmptyText}>{Strings.groupAssignNone}</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerRow, selectedId === item.id && styles.pickerRowSelected]}
                  onPress={() => { onSelect(item); onClose(); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.pickerRowInfo}>
                    <Text style={[styles.pickerRowName, selectedId === item.id && styles.pickerRowNameSelected]}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedId === item.id && <Text style={styles.pickerCheck}>✓</Text>}
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

// ── AssignContentModal ────────────────────────────────────────────────────────

function AssignContentModal({
  visible,
  memberCount,
  routines,
  cardios,
  nutritionPlans,
  isAssigning,
  onAssign,
  onClose,
}: {
  visible:       boolean;
  memberCount:   number;
  routines:      PickerItem[];
  cardios:       PickerItem[];
  nutritionPlans:PickerItem[];
  isAssigning:   boolean;
  onAssign:      (routineId: string | null, cardioId: string | null, nutritionPlanId: string | null) => void;
  onClose:       () => void;
}) {
  const [routineId,       setRoutineId]       = useState<string | null>(null);
  const [routineName,     setRoutineName]     = useState(Strings.groupAssignNone);
  const [cardioId,        setCardioId]        = useState<string | null>(null);
  const [cardioName,      setCardioName]      = useState(Strings.groupAssignNone);
  const [nutritionPlanId, setNutritionPlanId] = useState<string | null>(null);
  const [nutritionName,   setNutritionName]   = useState(Strings.groupAssignNone);

  const [showRoutinePicker,   setShowRoutinePicker]   = useState(false);
  const [showCardioPicker,    setShowCardioPicker]    = useState(false);
  const [showNutritionPicker, setShowNutritionPicker] = useState(false);

  const reset = () => {
    setRoutineId(null);       setRoutineName(Strings.groupAssignNone);
    setCardioId(null);        setCardioName(Strings.groupAssignNone);
    setNutritionPlanId(null); setNutritionName(Strings.groupAssignNone);
  };

  const hasSelection = !!(routineId || cardioId || nutritionPlanId);
  const canAssign    = hasSelection && memberCount > 0 && !isAssigning;

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={reset} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.assignSheet}>
          <Text style={styles.assignTitle}>{Strings.groupAssignTitle}</Text>
          <Text style={styles.assignDescription}>{Strings.groupAssignDescription}</Text>

          {/* Routine picker */}
          <Text style={styles.assignLabel}>{Strings.groupAssignRoutine}</Text>
          <TouchableOpacity style={styles.assignPicker} onPress={() => setShowRoutinePicker(true)} activeOpacity={0.8}>
            <Text style={[styles.assignPickerText, !routineId && styles.assignPickerMuted]}>{routineName}</Text>
            <Text style={styles.assignPickerArrow}>›</Text>
          </TouchableOpacity>

          {/* Cardio picker */}
          <Text style={[styles.assignLabel, { marginTop: Spacing.md }]}>{Strings.groupAssignCardio}</Text>
          <TouchableOpacity style={styles.assignPicker} onPress={() => setShowCardioPicker(true)} activeOpacity={0.8}>
            <Text style={[styles.assignPickerText, !cardioId && styles.assignPickerMuted]}>{cardioName}</Text>
            <Text style={styles.assignPickerArrow}>›</Text>
          </TouchableOpacity>

          {/* Nutrition picker */}
          <Text style={[styles.assignLabel, { marginTop: Spacing.md }]}>{Strings.groupAssignNutrition}</Text>
          <TouchableOpacity style={styles.assignPicker} onPress={() => setShowNutritionPicker(true)} activeOpacity={0.8}>
            <Text style={[styles.assignPickerText, !nutritionPlanId && styles.assignPickerMuted]}>{nutritionName}</Text>
            <Text style={styles.assignPickerArrow}>›</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.assignActions}>
            <TouchableOpacity style={styles.assignCancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.assignCancelBtnText}>{Strings.groupAssignCancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.assignConfirmBtn, !canAssign && styles.assignConfirmBtnDisabled]}
              onPress={() => onAssign(routineId, cardioId, nutritionPlanId)}
              disabled={!canAssign}
              activeOpacity={0.8}
            >
              {isAssigning
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.assignConfirmBtnText}>{Strings.groupAssignButton}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ContentPickerModal
        visible={showRoutinePicker}
        items={routines}
        selectedId={routineId}
        onSelect={(item) => { setRoutineId(item?.id ?? null); setRoutineName(item?.name ?? Strings.groupAssignNone); }}
        onClose={() => setShowRoutinePicker(false)}
      />
      <ContentPickerModal
        visible={showCardioPicker}
        items={cardios}
        selectedId={cardioId}
        onSelect={(item) => { setCardioId(item?.id ?? null); setCardioName(item?.name ?? Strings.groupAssignNone); }}
        onClose={() => setShowCardioPicker(false)}
      />
      <ContentPickerModal
        visible={showNutritionPicker}
        items={nutritionPlans}
        selectedId={nutritionPlanId}
        onSelect={(item) => { setNutritionPlanId(item?.id ?? null); setNutritionName(item?.name ?? Strings.groupAssignNone); }}
        onClose={() => setShowNutritionPicker(false)}
      />
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { user } = useAuthStore();
  const { id: groupId, name: groupName } = useLocalSearchParams<{ id: string; name: string }>();

  const { members, fetchMembers, addMember, removeMember,
          assignContentToGroup, isAssigning, error, clearError } = useAthleteGroupStore();

  const { routines, fetchCoachRoutines }             = useRoutineStore();
  const { catalog: cardios, fetchAll: fetchCardios } = useCardioStore();
  const { coachPlans, fetchCoachPlans }               = useNutritionStore();

  const memberIds = members[groupId] ?? [];

  const [allAthletes,     setAllAthletes]     = useState<AthleteSummary[]>([]);
  const [athletesLoading, setAthletesLoading] = useState(true);
  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchMembers(groupId);
  }, [groupId]));

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

    fetchCoachRoutines(user.id);
    fetchCardios(user.id);
    fetchCoachPlans(user.id);
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

  const handleAssign = async (
    routineId: string | null,
    cardioId: string | null,
    nutritionPlanId: string | null,
  ) => {
    try {
      await assignContentToGroup(groupId, { routineId, cardioId, nutritionPlanId });
      setShowAssignModal(false);
      Alert.alert(Strings.groupAssignSuccess);
    } catch (err) {
      setShowAssignModal(false);
      Alert.alert(
        Strings.groupAssignTitle,
        err instanceof Error ? err.message : Strings.groupAssignPartialError,
      );
    }
  };

  const routineItems    = routines.map((r) => ({ id: r.id, name: r.name }));
  const cardioItems     = cardios.map((c) => ({ id: c.id, name: c.name }));
  const nutritionItems  = coachPlans.map((p) => ({ id: p.id, name: p.name }));

  const isLoading = athletesLoading && memberIds.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{decodeURIComponent(groupName ?? '')}</Text>
          <Text style={styles.subtitle}>{Strings.groupMembers(memberIds.length)}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.assignBtn, memberIds.length === 0 && styles.assignBtnDisabled]}
            onPress={() => setShowAssignModal(true)}
            disabled={memberIds.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.assignBtnText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>{Strings.groupDetailAddMembers}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={clearError}><Text style={styles.errorBannerDismiss}>✕</Text></TouchableOpacity>
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
        onAdd={async (athlete) => { await addMember(groupId, athlete.id); }}
        onClose={() => setShowAddModal(false)}
      />

      <AssignContentModal
        visible={showAssignModal}
        memberCount={memberIds.length}
        routines={routineItems}
        cardios={cardioItems}
        nutritionPlans={nutritionItems}
        isAssigning={isAssigning}
        onAssign={handleAssign}
        onClose={() => setShowAssignModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:                  { flex: 1, backgroundColor: Colors.background },
  header:                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:                 { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:              { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  headerActions:         { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  assignBtn:             { width: 36, height: 36, borderRadius: 18, backgroundColor: `${Colors.primary}15`, borderWidth: 1, borderColor: `${Colors.primary}40`, alignItems: 'center', justifyContent: 'center' },
  assignBtnDisabled:     { opacity: 0.4 },
  assignBtnText:         { fontSize: 16 },
  addBtn:                { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText:            { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  center:                { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:            { fontSize: 40 },
  emptyText:             { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle:         { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  errorBanner:           { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: `${Colors.error}15`, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.error}30` },
  errorBannerText:       { flex: 1, fontSize: FontSize.sm, color: Colors.error },
  errorBannerDismiss:    { fontSize: FontSize.sm, color: Colors.error, fontWeight: '700', paddingLeft: Spacing.sm },
  list:                  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm, paddingBottom: Spacing.xxl },

  // Member row
  row:                   { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  rowAvatar:             { width: 40, height: 40, borderRadius: 20, backgroundColor: `${Colors.primary}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowAvatarText:         { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  rowInfo:               { flex: 1 },
  rowName:               { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  rowEmail:              { fontSize: FontSize.xs, color: Colors.textMuted },
  removeBtn:             { width: 30, height: 30, borderRadius: 15, backgroundColor: `${Colors.error}10`, borderWidth: 1, borderColor: `${Colors.error}30`, alignItems: 'center', justifyContent: 'center' },
  removeBtnText:         { fontSize: FontSize.sm, color: Colors.error, fontWeight: '700' },

  // Shared modal overlay
  overlay:               { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet:           { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '65%', paddingBottom: Spacing.xxl },
  pickerHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerTitle:           { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  doneBtn:               { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  doneBtnText:           { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  pickerRow:             { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  pickerRowSelected:     { backgroundColor: Colors.primarySubtle },
  pickerRowInfo:         { flex: 1 },
  pickerRowName:         { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  pickerRowNameSelected: { color: Colors.primary, fontWeight: '700' },
  pickerRowEmail:        { fontSize: FontSize.xs, color: Colors.textMuted },
  pickerRowAdd:          { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700', width: 24, textAlign: 'center' },
  pickerCheck:           { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  pickerEmpty:           { padding: Spacing.xl, alignItems: 'center' },
  pickerEmptyText:       { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },

  // Assign content modal
  assignSheet:           { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  assignTitle:           { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  assignDescription:     { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 20, marginBottom: Spacing.xs },
  assignLabel:           { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  assignPicker:          { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  assignPickerText:      { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  assignPickerMuted:     { color: Colors.textMuted, fontWeight: '400' },
  assignPickerArrow:     { fontSize: FontSize.lg, color: Colors.textMuted },
  assignActions:         { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  assignCancelBtn:       { flex: 1, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  assignCancelBtnText:   { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  assignConfirmBtn:      { flex: 2, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', backgroundColor: Colors.primary },
  assignConfirmBtnDisabled: { opacity: 0.4 },
  assignConfirmBtnText:  { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
