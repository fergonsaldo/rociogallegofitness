import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { ExercisePicker } from '../../../src/presentation/components/coach/ExercisePicker';
import { Exercise } from '../../../src/domain/entities/Exercise';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';

interface DayDraft {
  dayNumber: number;
  name: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    targetSets: number;
    targetReps?: number;
    targetDurationSeconds?: number;
    restBetweenSetsSeconds: number;
  }>;
}

const DEFAULT_DAY_NAMES = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRoutine, isCreating } = useRoutineStore();

  // Step 1 — info
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');

  // Step 2 — days
  const [days, setDays] = useState<DayDraft[]>([
    { dayNumber: 1, name: 'Day 1', exercises: [] },
  ]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // ── Helpers ────────────────────────────────────────────────
  const addDay = () => {
    if (days.length >= 7) return;
    const next = days.length + 1;
    setDays([...days, { dayNumber: next, name: `Day ${next}`, exercises: [] }]);
    setActiveDayIndex(days.length);
  };

  const updateDayName = (index: number, newName: string) => {
    setDays(days.map((d, i) => (i === index ? { ...d, name: newName } : d)));
  };

  const addExerciseToDay = (index: number, exercise: Exercise) => {
    setDays(days.map((d, i) => {
      if (i !== index) return d;
      const alreadyAdded = d.exercises.some((e) => e.exerciseId === exercise.id);
      if (alreadyAdded) return d;
      return {
        ...d,
        exercises: [
          ...d.exercises,
          {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            order: d.exercises.length + 1,
            targetSets: 3,
            targetReps: exercise.isIsometric ? undefined : 10,
            targetDurationSeconds: exercise.isIsometric ? 30 : undefined,
            restBetweenSetsSeconds: 90,
          },
        ],
      };
    }));
  };

  const removeExercise = (dayIndex: number, exerciseId: string) => {
    setDays(days.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises
          .filter((e) => e.exerciseId !== exerciseId)
          .map((e, idx) => ({ ...e, order: idx + 1 })),
      };
    }));
  };

  const updateExerciseField = (
    dayIndex: number,
    exerciseId: string,
    field: string,
    value: number
  ) => {
    setDays(days.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, [field]: value } : e
        ),
      };
    }));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please give your routine a name.');
      return;
    }
    if (days.some((d) => d.exercises.length === 0)) {
      Alert.alert('Empty day', 'Every day must have at least one exercise.');
      return;
    }

    const routine = await createRoutine({
      coachId: user!.id,
      name: name.trim(),
      description: description.trim() || undefined,
      durationWeeks: durationWeeks ? parseInt(durationWeeks, 10) : undefined,
      days: days.map((d) => ({
        id: '',
        routineId: '',
        dayNumber: d.dayNumber,
        name: d.name,
        exercises: d.exercises.map((e) => ({
          id: '',
          routineDayId: '',
          exerciseId: e.exerciseId,
          order: e.order,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetDurationSeconds: e.targetDurationSeconds,
          restBetweenSetsSeconds: e.restBetweenSetsSeconds,
        })),
      })),
    });

    if (routine) router.back();
  };

  const activeDay = days[activeDayIndex];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => (step === 1 ? router.back() : setStep(1))}>
          <Text style={styles.backText}>{step === 1 ? '✕ Cancel' : '← Back'}</Text>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          {[1, 2].map((s) => (
            <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
          ))}
        </View>
        {step === 2 ? (
          <TouchableOpacity
            style={[styles.saveButton, isCreating && styles.saveButtonDisabled]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveButtonText}>Save</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              if (!name.trim()) {
                Alert.alert('Missing name', 'Routine name is required.');
                return;
              }
              setStep(2);
            }}
          >
            <Text style={styles.saveButtonText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1 — Info ── */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Routine Details</Text>

            <Field label="NAME *">
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Strength Program A"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>

            <Field label="DESCRIPTION">
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description for your athletes..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </Field>

            <Field label="DURATION (WEEKS)">
              <TextInput
                style={styles.input}
                value={durationWeeks}
                onChangeText={setDurationWeeks}
                placeholder="e.g. 8"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </Field>
          </View>
        )}

        {/* ── STEP 2 — Days & Exercises ── */}
        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Days & Exercises</Text>

            {/* Day selector tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
              {days.map((d, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayTab, idx === activeDayIndex && styles.dayTabActive]}
                  onPress={() => setActiveDayIndex(idx)}
                >
                  <Text style={[styles.dayTabText, idx === activeDayIndex && styles.dayTabTextActive]}>
                    Day {d.dayNumber}
                  </Text>
                  {d.exercises.length > 0 && (
                    <View style={styles.dayTabBadge}>
                      <Text style={styles.dayTabBadgeText}>{d.exercises.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {days.length < 7 && (
                <TouchableOpacity style={styles.addDayButton} onPress={addDay}>
                  <Text style={styles.addDayText}>+ Day</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Active day name */}
            <Field label="DAY NAME">
              <TextInput
                style={styles.input}
                value={activeDay.name}
                onChangeText={(t) => updateDayName(activeDayIndex, t)}
                placeholder="e.g. Push Day"
                placeholderTextColor={Colors.textMuted}
              />
            </Field>

            {/* Exercises list */}
            {activeDay.exercises.map((ex, exIdx) => (
              <View key={ex.exerciseId} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <Text style={styles.exerciseCardName}>{ex.exerciseName}</Text>
                  <TouchableOpacity onPress={() => removeExercise(activeDayIndex, ex.exerciseId)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseFields}>
                  <NumberField
                    label="Sets"
                    value={ex.targetSets}
                    onChange={(v) => updateExerciseField(activeDayIndex, ex.exerciseId, 'targetSets', v)}
                    min={1} max={20}
                  />
                  {ex.targetReps !== undefined ? (
                    <NumberField
                      label="Reps"
                      value={ex.targetReps}
                      onChange={(v) => updateExerciseField(activeDayIndex, ex.exerciseId, 'targetReps', v)}
                      min={1} max={100}
                    />
                  ) : (
                    <NumberField
                      label="Secs"
                      value={ex.targetDurationSeconds ?? 30}
                      onChange={(v) => updateExerciseField(activeDayIndex, ex.exerciseId, 'targetDurationSeconds', v)}
                      min={5} max={600}
                    />
                  )}
                  <NumberField
                    label="Rest (s)"
                    value={ex.restBetweenSetsSeconds}
                    onChange={(v) => updateExerciseField(activeDayIndex, ex.exerciseId, 'restBetweenSetsSeconds', v)}
                    min={0} max={600}
                  />
                </View>
              </View>
            ))}

            <ExercisePicker
              onSelect={(ex) => addExerciseToDay(activeDayIndex, ex)}
              selectedIds={activeDay.exercises.map((e) => e.exerciseId)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Small helper components ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NumberField({
  label, value, onChange, min, max,
}: {
  label: string; value: number;
  onChange: (v: number) => void;
  min: number; max: number;
}) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.numberFieldLabel}>{label}</Text>
      <View style={styles.numberFieldRow}>
        <TouchableOpacity
          style={styles.numberBtn}
          onPress={() => onChange(Math.max(min, value - (label === 'Rest (s)' ? 15 : 1)))}
        >
          <Text style={styles.numberBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.numberValue}>{value}</Text>
        <TouchableOpacity
          style={styles.numberBtn}
          onPress={() => onChange(Math.min(max, value + (label === 'Rest (s)' ? 15 : 1)))}
        >
          <Text style={styles.numberBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary },
  saveButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    minWidth: 60, alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  scroll: { flex: 1 },
  section: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md,
  },
  inputMultiline: { height: 88, textAlignVertical: 'top' },
  dayTabs: { marginBottom: Spacing.md },
  dayTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginRight: Spacing.sm, backgroundColor: Colors.surface,
  },
  dayTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySubtle },
  dayTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  dayTabTextActive: { color: Colors.primary },
  dayTabBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  dayTabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addDayButton: {
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceMuted,
  },
  addDayText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  exerciseCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md,
  },
  exerciseCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseCardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  removeText: { color: Colors.textMuted, fontSize: FontSize.md, padding: 4 },
  exerciseFields: { flexDirection: 'row', gap: Spacing.md },
  numberField: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  numberFieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 1 },
  numberFieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  numberBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceMuted, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  numberBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
  numberValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, minWidth: 28, textAlign: 'center' },
});
