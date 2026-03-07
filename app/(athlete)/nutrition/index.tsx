import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { MacroSummaryCard } from '../../../src/presentation/components/nutrition/MacroRing';
import { MealLogModal } from '../../../src/presentation/components/nutrition/MealLogModal';
import { Meal } from '../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';

export default function AthleteNutritionScreen() {
  const { user } = useAuthStore();
  const {
    assignedPlan, assignedPlanLoading,
    dailySummary, dailySummaryLoading,
    weeklyAdherence,
    fetchAssignedPlan, fetchDailySummary, fetchWeeklyAdherence,
  } = useNutritionStore();

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const today = new Date();

  useEffect(() => {
    if (!user?.id) return;
    fetchAssignedPlan(user.id).then(() => {
      fetchDailySummary(user.id, today);
      fetchWeeklyAdherence(user.id);
    });
  }, [user?.id]);

  if (assignedPlanLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.athlete} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!assignedPlan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>Nutrition</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🥗</Text>
          <Text style={styles.emptyTitle}>No nutrition plan yet</Text>
          <Text style={styles.emptySubtitle}>Your coach hasn't assigned a plan yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  const consumed = dailySummary?.totalConsumed ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const target = assignedPlan.dailyTargetMacros;
  const progress = dailySummary?.progress ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Which meals have been logged today?
  const loggedMealIds = new Set(dailySummary?.logEntries.map((e) => e.mealId) ?? []);

  return (
    <SafeAreaView style={styles.safe}>
      {selectedMeal && (
        <MealLogModal meal={selectedMeal} onClose={() => {
          setSelectedMeal(null);
          if (user?.id) fetchDailySummary(user.id, today);
        }} />
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>Nutrition</Text>
              <Text style={styles.subtitle}>{assignedPlan.name}</Text>
            </View>
          </View>
          <Text style={styles.dateLabel}>
            {today.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Daily macro summary */}
        <View style={styles.section}>
          {dailySummaryLoading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={Colors.athlete} /></View>
          ) : (
            <MacroSummaryCard
              calories={{ consumed: consumed.calories, target: target.calories, progress: progress.calories }}
              protein={  { consumed: consumed.proteinG, target: target.proteinG, progress: progress.protein }}
              carbs={    { consumed: consumed.carbsG,   target: target.carbsG,   progress: progress.carbs }}
              fat={      { consumed: consumed.fatG,     target: target.fatG,     progress: progress.fat }}
            />
          )}
        </View>

        {/* Weekly adherence strip */}
        {weeklyAdherence.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>THIS WEEK</Text>
            <View style={styles.adherenceRow}>
              {weeklyAdherence.map((day, i) => {
                const isToday = day.date.toDateString() === today.toDateString();
                const dayName = day.date.toLocaleDateString('en', { weekday: 'narrow' });
                return (
                  <View key={i} style={styles.adherenceDay}>
                    <View style={[
                      styles.adherenceBar,
                      { height: Math.max(4, day.calorieProgress * 48) },
                      day.logged
                        ? day.calorieProgress >= 0.9
                          ? styles.adherenceBarGood
                          : styles.adherenceBarPartial
                        : styles.adherenceBarEmpty,
                      isToday && styles.adherenceBarToday,
                    ]} />
                    <Text style={[styles.adherenceDayLabel, isToday && styles.adherenceDayLabelToday]}>
                      {dayName}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S MEALS</Text>
          {assignedPlan.meals.map((meal) => {
            const isLogged = loggedMealIds.has(meal.id);
            const logEntry = dailySummary?.logEntries.find((e) => e.mealId === meal.id);
            return (
              <TouchableOpacity
                key={meal.id}
                style={[styles.mealCard, isLogged && styles.mealCardLogged]}
                onPress={() => !isLogged && setSelectedMeal(meal)}
                activeOpacity={isLogged ? 1 : 0.7}
              >
                {/* Left accent */}
                <View style={[styles.mealAccent, isLogged
                  ? styles.mealAccentLogged : styles.mealAccentPending]} />

                <View style={styles.mealContent}>
                  <View style={styles.mealTop}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    {isLogged ? (
                      <View style={styles.loggedBadge}>
                        <Text style={styles.loggedBadgeText}>✓ Logged</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Tap to log</Text>
                      </View>
                    )}
                  </View>

                  {/* Target macros */}
                  <View style={styles.mealMacros}>
                    <MealMacroPill label="P" value={`${meal.targetMacros.proteinG}g`} color={Colors.primary} />
                    <MealMacroPill label="C" value={`${meal.targetMacros.carbsG}g`}   color={Colors.athlete} />
                    <MealMacroPill label="F" value={`${meal.targetMacros.fatG}g`}     color={Colors.warning} />
                    <MealMacroPill label="~" value={`${meal.targetMacros.calories}kcal`} color={Colors.textMuted} />
                  </View>

                  {/* Actual logged macros */}
                  {isLogged && logEntry && (
                    <View style={styles.actualMacros}>
                      <Text style={styles.actualLabel}>Logged: </Text>
                      <Text style={styles.actualValue}>
                        {logEntry.actualMacros.proteinG}g P · {logEntry.actualMacros.carbsG}g C · {logEntry.actualMacros.fatG}g F · {logEntry.actualMacros.calories} kcal
                      </Text>
                    </View>
                  )}

                  {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MealMacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.athlete, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  dateLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  loadingBox: { padding: Spacing.xl, alignItems: 'center' },
  adherenceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 64 },
  adherenceDay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  adherenceBar: { width: '100%', borderRadius: 4, minHeight: 4 },
  adherenceBarGood: { backgroundColor: Colors.success },
  adherenceBarPartial: { backgroundColor: Colors.athlete },
  adherenceBarEmpty: { backgroundColor: Colors.border },
  adherenceBarToday: { opacity: 1, borderWidth: 1.5, borderColor: Colors.primary },
  adherenceDayLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  adherenceDayLabelToday: { color: Colors.primary, fontWeight: '800' },
  mealCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  mealCardLogged: { opacity: 0.85 },
  mealAccent: { width: 4, alignSelf: 'stretch' },
  mealAccentLogged: { backgroundColor: Colors.success },
  mealAccentPending: { backgroundColor: Colors.athlete },
  mealContent: { flex: 1, padding: Spacing.md, gap: Spacing.xs },
  mealTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  loggedBadge: {
    backgroundColor: `${Colors.success}15`, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: `${Colors.success}40`,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  loggedBadgeText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '700' },
  pendingBadge: {
    backgroundColor: Colors.athleteSubtle, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: `${Colors.athlete}40`,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  pendingBadgeText: { fontSize: FontSize.xs, color: Colors.athlete, fontWeight: '600' },
  mealMacros: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', gap: 3,
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  pillLabel: { fontSize: 9, fontWeight: '800' },
  pillValue: { fontSize: 9, color: Colors.textSecondary },
  actualMacros: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: `${Colors.success}08`, borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  actualLabel: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '700' },
  actualValue: { fontSize: FontSize.xs, color: Colors.textSecondary },
  mealNotes: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
});
