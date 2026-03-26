import {
  View, Text, FlatList, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { NutritionPlan, PlanType, PLAN_TYPES } from '../../../src/domain/entities/NutritionPlan';
import { filterNutritionPlans } from '../../../src/application/coach/NutritionUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { supabase } from '../../../src/infrastructure/supabase/client';

// ── Types ───────────────────────────────────────────────────────────────────────

interface AthleteOption {
  id: string;
  full_name: string;
  email: string;
}

// ── Labels ─────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PlanType, string> = {
  deficit:     Strings.nutritionPlanTypeDeficit,
  maintenance: Strings.nutritionPlanTypeMaintenance,
  surplus:     Strings.nutritionPlanTypeSurplus,
  other:       Strings.nutritionPlanTypeOther,
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function CoachNutritionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { coachPlans, coachPlansLoading, error, fetchCoachPlans, deletePlan, duplicatePlan, assignMultipleToAthlete } =
    useNutritionStore();

  const [query, setQuery]             = useState('');
  const [activeTypes, setActiveTypes] = useState<PlanType[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode]   = useState(false);

  const [modalVisible, setModalVisible]     = useState(false);
  const [athletes, setAthletes]             = useState<AthleteOption[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [assigningId, setAssigningId]       = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchCoachPlans(user.id);
    }, [user?.id]),
  );

  const filtered = filterNutritionPlans(coachPlans, query, activeTypes);

  const toggleType = (t: PlanType) =>
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  // ── Selection mode ────────────────────────────────────────────────────────

  const handleLongPress = (plan: NutritionPlan) => {
    setSelectMode(true);
    setSelectedIds(new Set([plan.id]));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // ── Bulk assign ───────────────────────────────────────────────────────────

  const handleOpenModal = async () => {
    setModalVisible(true);
    setLoadingAthletes(true);
    try {
      const { data, error: err } = await supabase
        .from('coach_athletes')
        .select('users!coach_athletes_athlete_id_fkey ( id, full_name, email )')
        .eq('coach_id', user!.id);
      if (err) throw err;
      const list: AthleteOption[] = (data ?? [])
        .map((row: any) => row.users)
        .filter(Boolean);
      setAthletes(list);
    } catch {
      setAthletes([]);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const handleAssign = async (athlete: AthleteOption) => {
    setAssigningId(athlete.id);
    const ids = Array.from(selectedIds);
    const ok = await assignMultipleToAthlete(ids, athlete.id);
    setAssigningId(null);
    if (ok) {
      setModalVisible(false);
      handleCancelSelect();
      Alert.alert('✓', Strings.nutritionBulkAssignSuccess(ids.length, athlete.full_name));
    }
  };

  // ── Duplicate ─────────────────────────────────────────────────────────────

  const handleDuplicate = (plan: NutritionPlan) => {
    duplicatePlan(plan, user!.id);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = (plan: NutritionPlan) => {
    Alert.alert(
      Strings.alertDeletePlanTitle,
      Strings.alertDeletePlanMessage(plan.name),
      [
        { text: Strings.alertDeleteCancel, style: 'cancel' },
        { text: Strings.alertDeleteConfirm, style: 'destructive', onPress: () => deletePlan(plan.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.accentBar} />
              <View>
                <Text style={styles.title}>{Strings.nutritionPlanTitle}</Text>
                <Text style={styles.subtitle}>{Strings.nutritionPlanSubtitle(coachPlans.length)}</Text>
              </View>
            </View>
            {selectMode ? (
              <TouchableOpacity onPress={handleCancelSelect} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(coach)/nutrition/create')}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>{Strings.nutritionPlanNewButton}</Text>
              </TouchableOpacity>
            )}
          </View>
          {!selectMode && (
            <View style={styles.headerLinks}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(coach)/recipes' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>{Strings.recipeNutritionLink}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(coach)/foods' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>{Strings.foodNutritionLink}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push('/(coach)/nutrition/groups' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>{Strings.planGroupLink}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.nutritionPlanSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Type chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          {PLAN_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, activeTypes.includes(t) && styles.chipActive]}
              onPress={() => toggleType(t)}
            >
              <Text style={[styles.chipText, activeTypes.includes(t) && styles.chipTextActive]}>
                {TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bulk-assign bar */}
        {selectMode && selectedIds.size > 0 && (
          <TouchableOpacity style={styles.bulkBar} onPress={handleOpenModal}>
            <Text style={styles.bulkBarCount}>{Strings.nutritionSelectionCount(selectedIds.size)}</Text>
            <Text style={styles.bulkBarAction}>{Strings.nutritionBulkAssignButton}</Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {coachPlansLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : coachPlans.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>{Strings.nutritionPlanEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.nutritionPlanEmptySubtitle}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(coach)/nutrition/create')}
            >
              <Text style={styles.emptyButtonText}>{Strings.nutritionPlanEmptyButton}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{Strings.nutritionPlanEmptySearch}</Text>
            <Text style={styles.emptySubtitle}>{Strings.nutritionPlanEmptySearchSubtitle(query)}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                {selectMode && (
                  <View style={[styles.checkbox, selectedIds.has(item.id) && styles.checkboxSelected]}>
                    {selectedIds.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                )}
                <View style={styles.cardFlex}>
                  <PlanCard
                    plan={item}
                    selected={selectedIds.has(item.id)}
                    onPress={() => {
                      if (selectMode) {
                        handleToggleSelect(item.id);
                      } else {
                        router.push({ pathname: '/(coach)/nutrition/[id]', params: { id: item.id } });
                      }
                    }}
                    onLongPress={() => handleLongPress(item)}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    selectMode={selectMode}
                  />
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Athlete picker modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{Strings.nutritionAssignTitle}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <Text style={styles.modalSubtitle}>{Strings.nutritionAssignSubtitle}</Text>

            {loadingAthletes ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : athletes.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyText}>{Strings.nutritionAssignEmpty}</Text>
              </View>
            ) : (
              <FlatList
                data={athletes}
                keyExtractor={(a) => a.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.athleteRow}
                    onPress={() => handleAssign(item)}
                    disabled={assigningId !== null}
                  >
                    <View style={styles.athleteAvatar}>
                      <Text style={styles.athleteAvatarText}>
                        {item.full_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.athleteInfo}>
                      <Text style={styles.athleteName}>{item.full_name}</Text>
                      <Text style={styles.athleteEmail}>{item.email}</Text>
                    </View>
                    {assigningId === item.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.assignIcon}>＋</Text>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.athleteList}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── PlanCard ───────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan:        NutritionPlan;
  onPress:     () => void;
  onLongPress?: () => void;
  onDuplicate: (p: NutritionPlan) => void;
  onDelete:    (p: NutritionPlan) => void;
  selected?:   boolean;
  selectMode?: boolean;
}

function PlanCard({ plan, onPress, onLongPress, onDuplicate, onDelete, selected, selectMode }: PlanCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{plan.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{TYPE_LABELS[plan.type]}</Text>
          </View>
        </View>
        {plan.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{plan.description}</Text>
        ) : null}
        <View style={styles.macroRow}>
          <MacroPill label="Cal" value={`${plan.dailyTargetMacros.calories}`} color={Colors.primary} />
          <MacroPill label="P"   value={`${plan.dailyTargetMacros.proteinG}g`} color="#E74C3C" />
          <MacroPill label="C"   value={`${plan.dailyTargetMacros.carbsG}g`}  color={Colors.athlete} />
          <MacroPill label="G"   value={`${plan.dailyTargetMacros.fatG}g`}    color={Colors.warning} />
        </View>
        <Text style={styles.mealCount}>{plan.meals.length} {plan.meals.length === 1 ? 'comida' : 'comidas'}</Text>
      </View>
      {!selectMode && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => onDuplicate(plan)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cardActionIcon}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(plan)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cardActionIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.macroPill, { borderColor: `${color}40`, backgroundColor: `${color}10` }]}>
      <Text style={[styles.macroPillLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroPillValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },

  headerWrapper: { paddingTop: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerLinks: { flexDirection: 'row', gap: Spacing.xs },
  accentBar:  { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title:      { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  secondaryButton: {
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  secondaryButtonText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },

  createButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  searchInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },

  chipsRow:     { flexGrow: 0, marginBottom: Spacing.xs },
  chipsContent: { gap: Spacing.xs, paddingRight: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  chipActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  list: { gap: Spacing.sm, paddingBottom: Spacing.xl, paddingTop: Spacing.sm },
  cardWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardFlex: { flex: 1 },

  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  bulkBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
  },
  bulkBarCount:  { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  bulkBarAction: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  cancelButton: {
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.textSecondary,
  },
  cancelButtonText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  cardAccent:  { width: 4, backgroundColor: Colors.primary },
  cardContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardName:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  cardDesc:    { fontSize: FontSize.xs, color: Colors.textSecondary },
  macroRow:    { flexDirection: 'row', gap: Spacing.xs, marginTop: 2 },
  mealCount:   { fontSize: FontSize.xs, color: Colors.textMuted },

  typeBadge: {
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  typeBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },

  macroPill: {
    flexDirection: 'row', gap: 3, borderWidth: 1,
    borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2,
  },
  macroPillLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  macroPillValue: { fontSize: 9, fontWeight: '600' },

  cardActions:    { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  cardActionIcon: { fontSize: 18 },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyText:     { fontSize: FontSize.md, color: Colors.textSecondary },

  // Modal
  modalContainer:    { flex: 1, paddingHorizontal: Spacing.lg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.lg,
  },
  modalHeaderSpacer: { width: 60 },
  modalCancelText:   { color: Colors.primary, fontSize: FontSize.md },
  modalTitle:        { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  athleteList:       { paddingBottom: Spacing.xl },
  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  athleteAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  athleteAvatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  athleteInfo:       { flex: 1 },
  athleteName:       { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  athleteEmail:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  assignIcon:        { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700' },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
});
