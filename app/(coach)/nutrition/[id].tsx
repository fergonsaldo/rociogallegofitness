import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { macroPercentages } from '../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';

export default function NutritionPlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { coachPlans, fetchCoachPlans } = useNutritionStore();

  const plan = coachPlans.find((p) => p.id === id);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const pct = macroPercentages(plan.dailyTargetMacros);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignBtn}>
          <Text style={styles.assignBtnText}>Assign to Athlete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.description && <Text style={styles.planDesc}>{plan.description}</Text>}

          {/* Macro summary */}
          <View style={styles.macroSummary}>
            <MacroTotal label="Calories" value={`${plan.dailyTargetMacros.calories}`} unit="kcal" color={Colors.primary} />
            <MacroTotal label="Protein"  value={`${plan.dailyTargetMacros.proteinG}`} unit="g"    color="#E74C3C" pct={pct.protein} />
            <MacroTotal label="Carbs"    value={`${plan.dailyTargetMacros.carbsG}`}   unit="g"    color={Colors.athlete} pct={pct.carbs} />
            <MacroTotal label="Fat"      value={`${plan.dailyTargetMacros.fatG}`}     unit="g"    color={Colors.warning} pct={pct.fat} />
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.mealsTitle}>MEAL PLAN · {plan.meals.length} meals</Text>
          {plan.meals.map((meal) => {
            const mPct = macroPercentages(meal.targetMacros);
            return (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealOrderBadge}>
                    <Text style={styles.mealOrderText}>{meal.order}</Text>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealCals}>{meal.targetMacros.calories} kcal</Text>
                </View>

                <View style={styles.mealMacros}>
                  <MealMacro label="P" value={meal.targetMacros.proteinG} pct={mPct.protein} color="#E74C3C" />
                  <MealMacro label="C" value={meal.targetMacros.carbsG}   pct={mPct.carbs}   color={Colors.athlete} />
                  <MealMacro label="F" value={meal.targetMacros.fatG}     pct={mPct.fat}     color={Colors.warning} />
                </View>

                {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroTotal({ label, value, unit, color, pct }: { label: string; value: string; unit: string; color: string; pct?: number }) {
  return (
    <View style={styles.macroTotal}>
      <Text style={styles.macroTotalLabel}>{label}</Text>
      <Text style={[styles.macroTotalValue, { color }]}>{value}</Text>
      <Text style={styles.macroTotalUnit}>{unit}{pct !== undefined ? ` (${pct}%)` : ''}</Text>
    </View>
  );
}

function MealMacro({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <View style={[styles.mealMacro, { backgroundColor: `${color}10`, borderColor: `${color}30` }]}>
      <Text style={[styles.mealMacroLabel, { color }]}>{label}</Text>
      <Text style={[styles.mealMacroValue, { color }]}>{value}g</Text>
      <Text style={[styles.mealMacroPct, { color }]}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  assignBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  assignBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  headerCard: {
    backgroundColor: Colors.surface, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: Spacing.sm,
  },
  planName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  planDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  macroSummary: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  macroTotal: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', minWidth: 72,
    borderWidth: 1, borderColor: Colors.border,
  },
  macroTotalLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  macroTotalValue: { fontSize: FontSize.lg, fontWeight: '800' },
  macroTotalUnit: { fontSize: 9, color: Colors.textMuted },
  mealsSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  mealsTitle: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  mealCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, backgroundColor: Colors.primarySubtle,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  mealOrderBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  mealOrderText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  mealName: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  mealCals: { fontSize: FontSize.xs, color: Colors.textSecondary },
  mealMacros: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  mealMacro: {
    flex: 1, borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', gap: 2,
  },
  mealMacroLabel: { fontSize: FontSize.xs, fontWeight: '800' },
  mealMacroValue: { fontSize: FontSize.md, fontWeight: '700' },
  mealMacroPct: { fontSize: 9 },
  mealNotes: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    fontStyle: 'italic',
  },
});
