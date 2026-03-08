import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useNutritionStore } from '../../../src/presentation/stores/nutritionStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

interface MealDraft {
  name: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  notes: string;
}

const MEAL_PRESETS = [
  { name: Strings.mealBreakfast, p: '35', c: '60', f: '15' },
  { name: Strings.mealLunch,     p: '45', c: '70', f: '20' },
  { name: Strings.mealDinner,    p: '45', c: '60', f: '20' },
  { name: Strings.mealSnack,     p: '15', c: '25', f: '8'  },
];

function calcCals(p: string, c: string, f: string) {
  return Math.round((parseFloat(p) || 0) * 4 + (parseFloat(c) || 0) * 4 + (parseFloat(f) || 0) * 9);
}

export default function CreateNutritionPlanScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createPlan, isSubmitting } = useNutritionStore();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 - plan info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalProtein, setTotalProtein] = useState('');
  const [totalCarbs, setTotalCarbs] = useState('');
  const [totalFat, setTotalFat] = useState('');

  // Step 2 - meals
  const [meals, setMeals] = useState<MealDraft[]>([
    { name: Strings.mealBreakfast, proteinG: '35', carbsG: '60', fatG: '15', notes: '' },
  ]);

  const totalCals = calcCals(totalProtein, totalCarbs, totalFat);
  const mealsCals = meals.reduce((sum, m) => sum + calcCals(m.proteinG, m.carbsG, m.fatG), 0);

  const addMeal = (preset?: typeof MEAL_PRESETS[0]) => {
    setMeals([...meals, {
      name: preset?.name ?? `Comida ${meals.length + 1}`,
      proteinG: preset?.p ?? '30',
      carbsG: preset?.c ?? '50',
      fatG: preset?.f ?? '15',
      notes: '',
    }]);
  };

  const updateMeal = (i: number, field: keyof MealDraft, value: string) => {
    setMeals(meals.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const removeMeal = (i: number) => {
    if (meals.length <= 1) return;
    setMeals(meals.filter((_, idx) => idx !== i));
  };

  const handleCreate = async () => {
    if (!user?.id) return;
    const p = parseFloat(totalProtein) || 0;
    const c = parseFloat(totalCarbs) || 0;
    const f = parseFloat(totalFat) || 0;

    const plan = await createPlan({
      coachId: user.id,
      name: name.trim(),
      description: description.trim() || undefined,
      dailyTargetMacros: { calories: totalCals, proteinG: p, carbsG: c, fatG: f },
      meals: meals.map((m, idx) => ({
        name: m.name.trim(),
        order: idx + 1,
        targetMacros: {
          calories: calcCals(m.proteinG, m.carbsG, m.fatG),
          proteinG: parseFloat(m.proteinG) || 0,
          carbsG: parseFloat(m.carbsG) || 0,
          fatG: parseFloat(m.fatG) || 0,
        },
        notes: m.notes.trim() || undefined,
      })),
    });

    if (plan) router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)}>
          <Text style={styles.backText}>{step === 1 ? '✕ Cancel' : '← Back'}</Text>
        </TouchableOpacity>
        <View style={styles.stepDots}>
          {[1, 2].map((s) => <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />)}
        </View>
        {step === 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => {
            if (!name.trim()) { Alert.alert('Name required', 'Give your plan a name.'); return; }
            if (!totalProtein && !totalCarbs && !totalFat) {
              Alert.alert('Macros required', 'Set daily macro targets.'); return;
            }
            setStep(2);
          }}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, isSubmitting && styles.nextBtnDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.nextBtnText}>Save</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan Details</Text>

            <Field label="NOMBRE *">
              <TextInput style={styles.input} value={name} onChangeText={setName}
                placeholder="ej. Volumen limpio fase 1" placeholderTextColor={Colors.textMuted} />
            </Field>

            <Field label={Strings.labelDescription}>
              <TextInput style={[styles.input, styles.inputMulti]} value={description}
                onChangeText={setDescription} multiline numberOfLines={3}
                placeholder="Notas opcionales para tu atleta..." placeholderTextColor={Colors.textMuted} />
            </Field>

            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Daily Macro Targets</Text>
            <Text style={styles.hint}>Calories are auto-calculated (4-4-9 formula)</Text>

            <View style={styles.macroInputRow}>
              <MacroField label={Strings.labelProteinG} value={totalProtein} onChange={setTotalProtein} color={Colors.primary} />
              <MacroField label={Strings.labelCarbsG}   value={totalCarbs}   onChange={setTotalCarbs}   color={Colors.athlete} />
              <MacroField label={Strings.labelFatG}     value={totalFat}     onChange={setTotalFat}     color={Colors.warning} />
            </View>

            <View style={styles.calsPreview}>
              <Text style={styles.calsPreviewLabel}>TOTAL DAILY CALORIES</Text>
              <Text style={styles.calsPreviewValue}>{totalCals} kcal</Text>
            </View>
          </View>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meals</Text>

            {/* Macros coverage indicator */}
            <View style={styles.coverageBanner}>
              <Text style={styles.coverageLabel}>MEALS TOTAL</Text>
              <Text style={[
                styles.coverageValue,
                mealsCals > totalCals * 1.1 && styles.coverageOver,
              ]}>
                {mealsCals} / {totalCals} kcal
              </Text>
            </View>

            {/* Meal cards */}
            {meals.map((meal, i) => (
              <View key={i} style={styles.mealCard}>
                <View style={styles.mealCardHeader}>
                  <TextInput
                    style={styles.mealNameInput}
                    value={meal.name}
                    onChangeText={(v) => updateMeal(i, 'name', v)}
                    placeholder={Strings.placeholderMealName}
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.mealCals}>{calcCals(meal.proteinG, meal.carbsG, meal.fatG)} kcal</Text>
                  {meals.length > 1 && (
                    <TouchableOpacity onPress={() => removeMeal(i)}>
                      <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.mealMacroRow}>
                  <MacroField label={Strings.labelProteinG} value={meal.proteinG} onChange={(v) => updateMeal(i, 'proteinG', v)} color={Colors.primary} />
                  <MacroField label={Strings.labelCarbsG}   value={meal.carbsG}   onChange={(v) => updateMeal(i, 'carbsG', v)}   color={Colors.athlete} />
                  <MacroField label={Strings.labelFatG}     value={meal.fatG}     onChange={(v) => updateMeal(i, 'fatG', v)}     color={Colors.warning} />
                </View>

                <TextInput
                  style={styles.mealNotesInput}
                  value={meal.notes}
                  onChangeText={(v) => updateMeal(i, 'notes', v)}
                  placeholder={Strings.placeholderMealNotes}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}

            {/* Presets */}
            <Text style={styles.presetsLabel}>ADD MEAL</Text>
            <View style={styles.presetsRow}>
              {MEAL_PRESETS.map((p) => (
                <TouchableOpacity key={p.name} style={styles.presetBtn} onPress={() => addMeal(p)}>
                  <Text style={styles.presetBtnText}>+ {p.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.presetBtn} onPress={() => addMeal()}>
                <Text style={styles.presetBtnText}>+ Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function MacroField({ label, value, onChange, color }: { label: string; value: string; onChange: (v: string) => void; color: string }) {
  return (
    <View style={styles.macroField}>
      <Text style={[styles.macroFieldLabel, { color }]}>{label}</Text>
      <TextInput
        style={[styles.macroFieldInput, { borderColor: `${color}40` }]}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary },
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minWidth: 60, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  scroll: { flex: 1 },
  section: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: -Spacing.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md,
  },
  inputMulti: { height: 88, textAlignVertical: 'top' },
  macroInputRow: { flexDirection: 'row', gap: Spacing.md },
  macroField: { flex: 1, gap: 4 },
  macroFieldLabel: { fontSize: FontSize.xs, fontWeight: '700' },
  macroFieldInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.lg, fontWeight: '800',
    color: Colors.textPrimary, textAlign: 'center',
  },
  calsPreview: {
    backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  calsPreviewLabel: { fontSize: FontSize.xs, color: Colors.primary, letterSpacing: 2, fontWeight: '600' },
  calsPreviewValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  coverageBanner: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  coverageLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 1.5, fontWeight: '600' },
  coverageValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  coverageOver: { color: Colors.error },
  mealCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md,
  },
  mealCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mealNameInput: {
    flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 4,
  },
  mealCals: { fontSize: FontSize.xs, color: Colors.textSecondary },
  removeText: { color: Colors.textMuted, fontSize: FontSize.md, padding: 4 },
  mealMacroRow: { flexDirection: 'row', gap: Spacing.md },
  mealNotesInput: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, fontSize: FontSize.xs, color: Colors.textSecondary,
  },
  presetsLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    letterSpacing: 2, fontWeight: '600', marginTop: Spacing.sm,
  },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  presetBtn: {
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceMuted,
  },
  presetBtnText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
});
