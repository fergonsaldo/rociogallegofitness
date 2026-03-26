import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { useRecipeStore } from '../../../src/presentation/stores/recipeStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Meal, macroPercentages } from '../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function NutritionPlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { coachPlans, linkRecipe, unlinkRecipe, error } = useNutritionStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  const [pickerMeal, setPickerMeal] = useState<Meal | null>(null);
  const [linkingId, setLinkingId]   = useState<string | null>(null);

  const plan = coachPlans.find((p) => p.id === id);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchRecipes(user.id);
    }, [user?.id]),
  );

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{Strings.nutritionPlanDetailBack}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const pct = macroPercentages(plan.dailyTargetMacros);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenPicker = (meal: Meal) => {
    setPickerMeal(meal);
  };

  const handleLink = async (recipeId: string) => {
    if (!pickerMeal) return;
    setLinkingId(recipeId);
    await linkRecipe(pickerMeal.id, recipeId, plan.id);
    setLinkingId(null);
    setPickerMeal(null);
  };

  const handleUnlink = (meal: Meal, recipeId: string, recipeName: string) => {
    Alert.alert(
      'Desvincular receta',
      `¿Desvincular "${recipeName}" de "${meal.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular', style: 'destructive',
          onPress: () => unlinkRecipe(meal.id, recipeId, plan.id),
        },
      ],
    );
  };

  // Recipes not yet linked to the open meal
  const availableRecipes = pickerMeal
    ? recipes.filter((r) => !pickerMeal.linkedRecipes.some((lr) => lr.id === r.id))
    : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>{Strings.nutritionPlanDetailBack}</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>{plan.name}</Text>
        <View style={styles.topbarSpacer} />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Macro header */}
        <View style={styles.headerCard}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.description ? <Text style={styles.planDesc}>{plan.description}</Text> : null}
          <View style={styles.macroSummary}>
            <MacroTotal label="Cal"    value={`${plan.dailyTargetMacros.calories}`} unit="kcal" color={Colors.primary} />
            <MacroTotal label="Prot"   value={`${plan.dailyTargetMacros.proteinG}`} unit="g" color="#E74C3C" pct={pct.protein} />
            <MacroTotal label="Carbs"  value={`${plan.dailyTargetMacros.carbsG}`}   unit="g" color={Colors.athlete} pct={pct.carbs} />
            <MacroTotal label="Grasa"  value={`${plan.dailyTargetMacros.fatG}`}     unit="g" color={Colors.warning} pct={pct.fat} />
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.mealsLabel}>{Strings.nutritionPlanMealsLabel(plan.meals.length)}</Text>

          {plan.meals.map((meal) => {
            const mPct = macroPercentages(meal.targetMacros);
            return (
              <View key={meal.id} style={styles.mealCard}>

                {/* Meal header */}
                <View style={styles.mealHeader}>
                  <View style={styles.mealOrderBadge}>
                    <Text style={styles.mealOrderText}>{meal.order}</Text>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealCals}>{meal.targetMacros.calories} kcal</Text>
                </View>

                {/* Meal macros */}
                <View style={styles.mealMacros}>
                  <MealMacro label="P" value={meal.targetMacros.proteinG} pct={mPct.protein} color="#E74C3C" />
                  <MealMacro label="C" value={meal.targetMacros.carbsG}   pct={mPct.carbs}   color={Colors.athlete} />
                  <MealMacro label="G" value={meal.targetMacros.fatG}     pct={mPct.fat}     color={Colors.warning} />
                </View>

                {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}

                {/* Linked recipes */}
                <View style={styles.recipesSection}>
                  <Text style={styles.recipesLabel}>{Strings.nutritionMealLinkedRecipes}</Text>

                  {meal.linkedRecipes.length === 0 ? (
                    <Text style={styles.recipesEmpty}>{Strings.nutritionMealNoRecipes}</Text>
                  ) : (
                    meal.linkedRecipes.map((lr) => (
                      <View key={lr.id} style={styles.recipeRow}>
                        <Text style={styles.recipeName} numberOfLines={1}>{lr.name}</Text>
                        <TouchableOpacity
                          onPress={() => handleUnlink(meal, lr.id, lr.name)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.unlinkIcon}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  <TouchableOpacity style={styles.addRecipeButton} onPress={() => handleOpenPicker(meal)}>
                    <Text style={styles.addRecipeText}>{Strings.nutritionMealAddRecipe}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      {/* Recipe picker modal */}
      <Modal
        visible={pickerMeal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerMeal(null)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPickerMeal(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{Strings.nutritionRecipePickerTitle}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <Text style={styles.modalSubtitle}>{Strings.nutritionRecipePickerSubtitle}</Text>

            {availableRecipes.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>🍽</Text>
                <Text style={styles.emptyText}>
                  {recipes.length === 0
                    ? Strings.nutritionRecipePickerEmpty
                    : Strings.nutritionRecipeAlreadyLinked}
                </Text>
              </View>
            ) : (
              <FlatList
                data={availableRecipes}
                keyExtractor={(r) => r.id}
                contentContainerStyle={styles.recipeList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recipePickerRow}
                    onPress={() => handleLink(item.id)}
                    disabled={linkingId !== null}
                  >
                    <View style={styles.recipeAvatar}>
                      <Text style={styles.recipeAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recipePickerName} numberOfLines={1}>{item.name}</Text>
                    {linkingId === item.id
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : <Text style={styles.linkIcon}>＋</Text>
                    }
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },

  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  topbarTitle:   { flex: 1, textAlign: 'center', fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginHorizontal: Spacing.sm },
  topbarSpacer:  { width: 60 },
  backText:      { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    borderRadius: BorderRadius.md, padding: Spacing.md, margin: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  headerCard: {
    backgroundColor: Colors.surface, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: Spacing.sm,
  },
  planName:     { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  planDesc:     { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  macroSummary: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  macroTotal: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', minWidth: 72,
    borderWidth: 1, borderColor: Colors.border,
  },
  macroTotalLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  macroTotalValue: { fontSize: FontSize.lg, fontWeight: '800' },
  macroTotalUnit:  { fontSize: 9, color: Colors.textMuted },

  mealsSection: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  mealsLabel:   { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },

  mealCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
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
  mealName:      { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  mealCals:      { fontSize: FontSize.xs, color: Colors.textSecondary },
  mealMacros:    { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  mealMacro: {
    flex: 1, borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', gap: 2,
  },
  mealMacroLabel: { fontSize: FontSize.xs, fontWeight: '800' },
  mealMacroValue: { fontSize: FontSize.md, fontWeight: '700' },
  mealMacroPct:   { fontSize: 9 },
  mealNotes: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, fontStyle: 'italic',
  },

  recipesSection: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.md, gap: Spacing.xs,
  },
  recipesLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 1 },
  recipesEmpty: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  recipeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.xs, gap: Spacing.sm,
  },
  recipeName:  { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  unlinkIcon:  { fontSize: 12, color: Colors.error, fontWeight: '700' },
  addRecipeButton: {
    marginTop: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.primary, alignItems: 'center',
    borderStyle: 'dashed',
  },
  addRecipeText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

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
  recipeList:        { paddingBottom: Spacing.xl },
  recipePickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  recipeAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  recipeAvatarText:  { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  recipePickerName:  { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  linkIcon:          { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700' },
  emptyEmoji:        { fontSize: 48 },
  emptyText:         { fontSize: FontSize.md, color: Colors.textSecondary },
});
