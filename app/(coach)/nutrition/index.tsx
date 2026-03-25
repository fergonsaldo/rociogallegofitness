import {
  View, Text, FlatList, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
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
  const { coachPlans, coachPlansLoading, error, fetchCoachPlans, deletePlan } =
    useNutritionStore();

  const [query, setQuery]           = useState('');
  const [activeTypes, setActiveTypes] = useState<PlanType[]>([]);

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
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(coach)/nutrition/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>{Strings.nutritionPlanNewButton}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerLinks}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(coach)/recipes/index' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{Strings.recipeNutritionLink}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(coach)/foods/index' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{Strings.foodNutritionLink}</Text>
            </TouchableOpacity>
          </View>
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
              <PlanCard
                plan={item}
                onPress={() => router.push({ pathname: '/(coach)/nutrition/[id]', params: { id: item.id } })}
                onDelete={handleDelete}
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── PlanCard ───────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan:     NutritionPlan;
  onPress:  () => void;
  onDelete: (p: NutritionPlan) => void;
}

function PlanCard({ plan, onPress, onDelete }: PlanCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(plan)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteIcon}>🗑</Text>
      </TouchableOpacity>
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

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
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

  deleteButton: { justifyContent: 'center', paddingHorizontal: Spacing.md },
  deleteIcon:   { fontSize: 18 },

  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
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
