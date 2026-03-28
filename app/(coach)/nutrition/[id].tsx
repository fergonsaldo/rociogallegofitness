import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { useRecipeStore } from '../../../src/presentation/stores/recipeStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Meal, macroPercentages, PLAN_TYPES, PlanType } from '../../../src/domain/entities/NutritionPlan';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  deficit:     Strings.nutritionPlanTypeDeficit,
  maintenance: Strings.nutritionPlanTypeMaintenance,
  surplus:     Strings.nutritionPlanTypeSurplus,
  other:       Strings.nutritionPlanTypeOther,
};

export default function NutritionPlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    coachPlans, linkRecipe, unlinkRecipe,
    updatePlanMeta, fetchPlanVersions, restoreVersion,
    planVersions, planVersionsLoading, isSubmitting, error,
  } = useNutritionStore();
  const { recipes, fetchRecipes } = useRecipeStore();

  const [pickerMeal, setPickerMeal]     = useState<Meal | null>(null);
  const [linkingId, setLinkingId]       = useState<string | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit]         = useState(false);
  const [editName, setEditName]         = useState('');
  const [editType, setEditType]         = useState<PlanType>('maintenance');
  const [editDesc, setEditDesc]         = useState('');
  const [editProtein, setEditProtein]   = useState('');
  const [editCarbs, setEditCarbs]       = useState('');
  const [editFat, setEditFat]           = useState('');

  // History modal state
  const [showHistory, setShowHistory]   = useState(false);

  const plan = coachPlans.find((p) => p.id === id);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchRecipes(user.id);
    }, [user?.id]),
  );

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const pct = macroPercentages(plan.dailyTargetMacros);

  // Auto-calc calories from macros (4-4-9)
  const calcCalories = (p: number, c: number, f: number) =>
    Math.round(p * 4 + c * 4 + f * 9);

  // ── Edit handlers ────────────────────────────────────────────────────────────

  const handleOpenEdit = () => {
    setEditName(plan.name);
    setEditType(plan.type);
    setEditDesc(plan.description ?? '');
    setEditProtein(String(plan.dailyTargetMacros.proteinG));
    setEditCarbs(String(plan.dailyTargetMacros.carbsG));
    setEditFat(String(plan.dailyTargetMacros.fatG));
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    const proteinG = parseFloat(editProtein) || 0;
    const carbsG   = parseFloat(editCarbs)   || 0;
    const fatG     = parseFloat(editFat)     || 0;
    const ok = await updatePlanMeta(plan.id, user!.id, {
      name:  editName.trim(),
      type:  editType,
      description: editDesc.trim() || null,
      dailyTargetMacros: {
        calories: calcCalories(proteinG, carbsG, fatG),
        proteinG, carbsG, fatG,
      },
    });
    if (ok) setShowEdit(false);
  };

  // ── History handlers ─────────────────────────────────────────────────────────

  const handleOpenHistory = async () => {
    await fetchPlanVersions(plan.id);
    setShowHistory(true);
  };

  const handleRestore = (versionId: string) => {
    Alert.alert(
      Strings.planVersionRestoreTitle,
      Strings.planVersionRestoreMessage,
      [
        { text: Strings.planVersionRestoreCancel, style: 'cancel' },
        {
          text: Strings.planVersionRestoreConfirm, style: 'default',
          onPress: async () => {
            const ok = await restoreVersion(versionId, plan.id, user!.id);
            if (ok) setShowHistory(false);
          },
        },
      ],
    );
  };

  // ── Recipe handlers ──────────────────────────────────────────────────────────

  const handleOpenPicker = (meal: Meal) => setPickerMeal(meal);

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

  const availableRecipes = pickerMeal
    ? recipes.filter((r) => !pickerMeal.linkedRecipes.some((lr) => lr.id === r.id))
    : [];

  const editCalories = calcCalories(
    parseFloat(editProtein) || 0,
    parseFloat(editCarbs)   || 0,
    parseFloat(editFat)     || 0,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle} numberOfLines={1}>{plan.name}</Text>
        <View style={styles.topbarActions}>
          <TouchableOpacity onPress={handleOpenHistory} style={styles.topbarAction}>
            <Text style={styles.topbarActionText}>🕐</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenEdit} style={styles.topbarAction}>
            <Text style={styles.topbarActionText}>✏️</Text>
          </TouchableOpacity>
        </View>
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

      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showEdit}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEdit(false)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Text style={styles.modalCancelText}>{Strings.planEditCancel}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{Strings.planEditModalTitle}</Text>
              <TouchableOpacity onPress={handleSaveEdit} disabled={isSubmitting || !editName.trim()}>
                {isSubmitting
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Text style={[styles.modalSaveText, !editName.trim() && styles.disabledText]}>
                      {Strings.planEditSave}
                    </Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{Strings.nutritionPlanFormLabelName}</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nombre del plan"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{Strings.nutritionPlanFormLabelType}</Text>
                <View style={styles.typeRow}>
                  {PLAN_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, editType === t && styles.typeChipActive]}
                      onPress={() => setEditType(t)}
                    >
                      <Text style={[styles.typeChipText, editType === t && styles.typeChipTextActive]}>
                        {PLAN_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>DESCRIPCIÓN (OPCIONAL)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder="Descripción del plan..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{Strings.nutritionPlanFormMacrosTitle}</Text>
                <Text style={styles.formHint}>{Strings.nutritionPlanFormMacrosHint}</Text>
                <View style={styles.macroInputRow}>
                  <MacroInput label="PROTEÍNA (g)" value={editProtein} onChange={setEditProtein} />
                  <MacroInput label="CARBOS (g)"   value={editCarbs}   onChange={setEditCarbs} />
                  <MacroInput label="GRASA (g)"    value={editFat}     onChange={setEditFat} />
                </View>
                <Text style={styles.calsPreview}>
                  {Strings.nutritionPlanFormTotalCals}: {editCalories} kcal
                </Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── History modal ────────────────────────────────────────────────────── */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderSpacer} />
              <Text style={styles.modalTitle}>{Strings.planHistoryTitle}</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={styles.modalCancelText}>{Strings.planHistoryClose}</Text>
              </TouchableOpacity>
            </View>

            {planVersionsLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : planVersions.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>🕐</Text>
                <Text style={styles.emptyText}>{Strings.planHistoryEmpty}</Text>
                <Text style={styles.emptySubtext}>{Strings.planHistoryEmptySubtitle}</Text>
              </View>
            ) : (
              <FlatList
                data={planVersions}
                keyExtractor={(v) => v.id}
                contentContainerStyle={styles.versionList}
                renderItem={({ item }) => (
                  <View style={styles.versionCard}>
                    <View style={styles.versionInfo}>
                      <Text style={styles.versionName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.versionType}>{PLAN_TYPE_LABELS[item.type]}</Text>
                      <Text style={styles.versionDate}>
                        {Strings.planVersionSavedAt(
                          item.savedAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        )}
                      </Text>
                      <Text style={styles.versionMacros}>
                        {item.dailyTargetMacros.calories} kcal · P {item.dailyTargetMacros.proteinG}g · C {item.dailyTargetMacros.carbsG}g · G {item.dailyTargetMacros.fatG}g
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.restoreButton}
                      onPress={() => handleRestore(item.id)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.restoreButtonText}>{Strings.planVersionRestoreButton}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Recipe picker modal ──────────────────────────────────────────────── */}
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

function MacroInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.macroInputItem}>
      <Text style={styles.macroInputLabel}>{label}</Text>
      <TextInput
        style={styles.macroInputField}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholderTextColor={Colors.textMuted}
        placeholder="0"
      />
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
  topbarTitle:   { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  topbarActions: { flexDirection: 'row', gap: Spacing.xs },
  topbarAction:  { paddingHorizontal: Spacing.xs },
  topbarActionText: { fontSize: FontSize.lg },

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

  // Modal shared
  modalContainer:    { flex: 1, paddingHorizontal: Spacing.lg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.lg,
  },
  modalHeaderSpacer: { width: 60 },
  modalCancelText:   { color: Colors.primary, fontSize: FontSize.md },
  modalSaveText:     { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  disabledText:      { opacity: 0.3 },
  modalTitle:        { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle:     { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

  // Edit form
  formGroup: { marginBottom: Spacing.lg, gap: Spacing.sm },
  formLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 1 },
  formHint:  { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  formInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.surface,
  },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText:   { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  macroInputRow:  { flexDirection: 'row', gap: Spacing.sm },
  macroInputItem: { flex: 1, gap: 4 },
  macroInputLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  macroInputField: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, textAlign: 'center',
  },
  calsPreview: {
    marginTop: Spacing.sm, fontSize: FontSize.sm,
    color: Colors.primary, fontWeight: '700', textAlign: 'center',
  },

  // History
  versionList: { paddingBottom: Spacing.xl, gap: Spacing.md },
  versionCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  versionInfo:  { flex: 1, gap: 2 },
  versionName:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  versionType:  { fontSize: FontSize.xs, color: Colors.textSecondary },
  versionDate:  { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  versionMacros:{ fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  restoreButton: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.primarySubtle,
    borderWidth: 1, borderColor: Colors.primary,
  },
  restoreButtonText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  // Recipe picker
  recipeList:      { paddingBottom: Spacing.xl },
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
