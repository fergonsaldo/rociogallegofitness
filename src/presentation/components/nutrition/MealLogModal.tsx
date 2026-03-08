import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { Meal } from '@/domain/entities/NutritionPlan';
import { useNutritionStore } from '../../stores/nutritionStore';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';

interface MealLogModalProps {
  meal: Meal;
  onClose: () => void;
}

/**
 * Slide-up modal where an athlete logs what they actually ate.
 * Pre-fills with the meal's target macros — athlete adjusts as needed.
 * Auto-calculates calories using the 4-4-9 formula on each keystroke.
 */
export function MealLogModal({ meal, onClose }: MealLogModalProps) {
  const { user } = useAuthStore();
  const { logMeal, isSubmitting } = useNutritionStore();

  const [protein, setProtein] = useState(String(meal.targetMacros.proteinG));
  const [carbs, setCarbs] = useState(String(meal.targetMacros.carbsG));
  const [fat, setFat] = useState(String(meal.targetMacros.fatG));
  const [notes, setNotes] = useState('');

  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fat) || 0;
  const calculatedCals = Math.round(p * 4 + c * 4 + f * 9);

  const handleLog = async () => {
    if (!user?.id) return;
    const entry = await logMeal({
      mealId: meal.id,
      athleteId: user.id,
      actualMacros: { calories: calculatedCals, proteinG: p, carbsG: c, fatG: f },
      notes: notes.trim() || undefined,
    });
    if (entry) onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Meal</Text>
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            onPress={handleLog}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll}>
          {/* Meal name */}
          <View style={styles.mealNameCard}>
            <Text style={styles.mealNameLabel}>MEAL</Text>
            <Text style={styles.mealName}>{meal.name}</Text>
            {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
          </View>

          {/* Target reference */}
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>TARGET</Text>
            <View style={styles.targetRow}>
              <TargetPill label="Protein" value={`${meal.targetMacros.proteinG}g`} />
              <TargetPill label="Carbs"   value={`${meal.targetMacros.carbsG}g`} />
              <TargetPill label="Fat"     value={`${meal.targetMacros.fatG}g`} />
              <TargetPill label="Cal"     value={`${meal.targetMacros.calories}kcal`} accent />
            </View>
          </View>

          {/* Macro inputs */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHAT YOU ATE</Text>

            <View style={styles.inputs}>
              <MacroInput label="Protein (g)" value={protein} onChange={setProtein} color={Colors.primary} />
              <MacroInput label="Carbs (g)"   value={carbs}   onChange={setCarbs}   color={Colors.athlete} />
              <MacroInput label="Fat (g)"     value={fat}     onChange={setFat}     color={Colors.warning} />
            </View>

            {/* Auto-calculated calories */}
            <View style={styles.calsCard}>
              <Text style={styles.calsLabel}>CALCULATED CALORIES</Text>
              <Text style={styles.calsValue}>{calculatedCals} kcal</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. slightly bigger portion..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function TargetPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.targetPill, accent && styles.targetPillAccent]}>
      <Text style={styles.targetPillLabel}>{label}</Text>
      <Text style={[styles.targetPillValue, accent && styles.targetPillValueAccent]}>{value}</Text>
    </View>
  );
}

function MacroInput({ label, value, onChange, color }: {
  label: string; value: string;
  onChange: (v: string) => void; color: string;
}) {
  return (
    <View style={styles.macroInputWrapper}>
      <Text style={[styles.macroInputLabel, { color }]}>{label}</Text>
      <TextInput
        style={[styles.macroInput, { borderColor: `${color}40` }]}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        selectTextOnFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minWidth: 56, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  scroll: { flex: 1 },
  mealNameCard: {
    backgroundColor: Colors.primarySubtle, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: `${Colors.primary}25`,
  },
  mealNameLabel: { fontSize: 9, color: Colors.primary, letterSpacing: 2, fontWeight: '700' },
  mealName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  mealNotes: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.xs },
  targetCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  targetLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600', marginBottom: Spacing.sm },
  targetRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  targetPill: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  targetPillAccent: { backgroundColor: Colors.primarySubtle, borderColor: `${Colors.primary}30` },
  targetPillLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  targetPillValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  targetPillValueAccent: { color: Colors.primary },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  inputs: { flexDirection: 'row', gap: Spacing.md },
  macroInputWrapper: { flex: 1, gap: 4 },
  macroInputLabel: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  macroInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.xl, fontWeight: '800',
    color: Colors.textPrimary, textAlign: 'center',
  },
  calsCard: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  calsLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 1.5, fontWeight: '600' },
  calsValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  notesInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    color: Colors.textPrimary, fontSize: FontSize.sm,
    textAlignVertical: 'top', minHeight: 72,
  },
});
