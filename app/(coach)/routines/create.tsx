import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { ExercisePicker } from '../../../src/presentation/components/coach/ExercisePicker';
import { Exercise } from '../../../src/domain/entities/Exercise';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { randomUUID } from 'expo-crypto';

const REST_OPTIONS: { label: string; value: number }[] = [
  { label: '30 seg', value: 30 },
  { label: '45 seg', value: 45 },
  { label: '1 min', value: 60 },
  { label: '1 min 30 seg', value: 90 },
  { label: '2 min', value: 120 },
  { label: '2 min 30 seg', value: 150 },
  { label: '3 min', value: 180 },
  { label: '3 min 30 seg', value: 210 },
  { label: '4 min', value: 240 },
  { label: '4 min 30 seg', value: 270 },
  { label: '5 min', value: 300 },
];

function restLabel(seconds: number): string {
  return REST_OPTIONS.find((o) => o.value === seconds)?.label ?? `${seconds}s`;
}

interface DayDraft {
  dayNumber: number;
  name: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    targetSets: number;
    targetRepsMin?: number;
    targetRepsMax?: number;
    targetDurationSeconds?: number;
    restBetweenSetsSeconds: number;
  }>;
}

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createRoutine, isCreating } = useRoutineStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<DayDraft[]>([{ dayNumber: 1, name: 'Día 1', exercises: [] }]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [restPickerFor, setRestPickerFor] = useState<string | null>(null);

  const addDay = () => {
    if (days.length >= 7) return;
    const next = days.length + 1;
    setDays([...days, { dayNumber: next, name: `Día ${next}`, exercises: [] }]);
    setActiveDayIndex(days.length);
  };

  const updateDayName = (index: number, newName: string) =>
    setDays(days.map((d, i) => (i === index ? { ...d, name: newName } : d)));

  const addExerciseToDay = (index: number, exercise: Exercise) => {
    setDays(days.map((d, i) => {
      if (i !== index) return d;
      if (d.exercises.some((e) => e.exerciseId === exercise.id)) return d;
      return {
        ...d,
        exercises: [...d.exercises, {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          order: d.exercises.length + 1,
          targetSets: 3,
          targetRepsMin: exercise.isIsometric ? undefined : 8,
          targetRepsMax: exercise.isIsometric ? undefined : 12,
          targetDurationSeconds: exercise.isIsometric ? 30 : undefined,
          restBetweenSetsSeconds: 90,
        }],
      };
    }));
  };

  const removeExercise = (dayIndex: number, exerciseId: string) =>
    setDays(days.map((d, i) => {
      if (i !== dayIndex) return d;
      return {
        ...d,
        exercises: d.exercises
          .filter((e) => e.exerciseId !== exerciseId)
          .map((e, idx) => ({ ...e, order: idx + 1 })),
      };
    }));

  const updateField = (dayIndex: number, exerciseId: string, field: string, value: number) =>
    setDays(days.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, exercises: d.exercises.map((e) => e.exerciseId === exerciseId ? { ...e, [field]: value } : e) };
    }));

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Falta el nombre', 'Ponle nombre a la rutina.'); return; }
    if (days.some((d) => d.exercises.length === 0)) { Alert.alert('Día vacío', 'Cada día debe tener al menos un ejercicio.'); return; }
    const routine = await createRoutine({
      coachId: user!.id,
      name: name.trim(),
      description: description.trim() || undefined,
      durationWeeks: undefined,
      days: days.map((d) => ({
        id: randomUUID(),
        routineId: randomUUID(),
        dayNumber: d.dayNumber,
        name: d.name,
        exercises: d.exercises.map((e) => ({
          id: randomUUID(),
          routineDayId: randomUUID(),
          exerciseId: e.exerciseId,
          order: e.order,
          targetSets: e.targetSets,
          targetReps: e.targetRepsMin,
          targetDurationSeconds: e.targetDurationSeconds,
          restBetweenSetsSeconds: e.restBetweenSetsSeconds,
          notes: e.targetRepsMax ? `repsMax:${e.targetRepsMax}` : undefined,
        })),
      })),
    });
    if (routine) router.back();
  };

  const activeDay = days[activeDayIndex];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Modal descanso */}
      <Modal visible={!!restPickerFor} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setRestPickerFor(null)} activeOpacity={1}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Tiempo de descanso</Text>
            <FlatList
              data={REST_OPTIONS}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const ex = activeDay.exercises.find((e) => e.exerciseId === restPickerFor);
                const selected = ex?.restBetweenSetsSeconds === item.value;
                return (
                  <TouchableOpacity
                    style={[styles.pickerOption, selected && styles.pickerOptionSelected]}
                    onPress={() => { updateField(activeDayIndex, restPickerFor!, 'restBetweenSetsSeconds', item.value); setRestPickerFor(null); }}
                  >
                    <Text style={[styles.pickerOptionText, selected && styles.pickerOptionTextSelected]}>{item.label}</Text>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => (step === 1 ? router.back() : setStep(1))}>
          <Text style={styles.backText}>{step === 1 ? '✕ Cancelar' : '← Atrás'}</Text>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          {[1, 2].map((s) => <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />)}
        </View>
        {step === 2 ? (
          <TouchableOpacity style={[styles.saveButton, isCreating && styles.saveButtonDisabled]} onPress={handleCreate} disabled={isCreating}>
            {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={() => { if (!name.trim()) { Alert.alert('Falta el nombre', 'El nombre es obligatorio.'); return; } setStep(2); }}>
            <Text style={styles.saveButtonText}>Siguiente →</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles de la rutina</Text>
            <Field label="NOMBRE *">
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Programa de fuerza A" placeholderTextColor={Colors.textMuted} />
            </Field>
            <Field label="DESCRIPCIÓN">
              <TextInput style={[styles.input, styles.inputMultiline]} value={description} onChangeText={setDescription} placeholder="Descripción opcional..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />
            </Field>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Días y ejercicios</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabs}>
              {days.map((d, idx) => (
                <TouchableOpacity key={idx} style={[styles.dayTab, idx === activeDayIndex && styles.dayTabActive]} onPress={() => setActiveDayIndex(idx)}>
                  <Text style={[styles.dayTabText, idx === activeDayIndex && styles.dayTabTextActive]}>Día {d.dayNumber}</Text>
                  {d.exercises.length > 0 && <View style={styles.dayTabBadge}><Text style={styles.dayTabBadgeText}>{d.exercises.length}</Text></View>}
                </TouchableOpacity>
              ))}
              {days.length < 7 && (
                <TouchableOpacity style={styles.addDayButton} onPress={addDay}>
                  <Text style={styles.addDayText}>+ Día</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <Field label="NOMBRE DEL DÍA">
              <TextInput style={styles.input} value={activeDay.name} onChangeText={(t) => updateDayName(activeDayIndex, t)} placeholder="Ej: Día de empuje" placeholderTextColor={Colors.textMuted} />
            </Field>

            {activeDay.exercises.map((ex) => (
              <View key={ex.exerciseId} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <Text style={styles.exerciseCardName}>{ex.exerciseName}</Text>
                  <TouchableOpacity onPress={() => removeExercise(activeDayIndex, ex.exerciseId)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.exerciseFields}>
                  <NumberField label="Series" value={ex.targetSets} onChange={(v) => updateField(activeDayIndex, ex.exerciseId, 'targetSets', v)} min={1} max={20} />

                  {ex.targetRepsMin !== undefined ? (
                    <View style={styles.repsRangeField}>
                      <Text style={styles.numberFieldLabel}>Reps</Text>
                      <View style={styles.repsRangeRow}>
                        <View style={styles.repsRangeInput}>
                          <Text style={styles.repsRangeHint}>mín</Text>
                          <View style={styles.numberFieldRow}>
                            <TouchableOpacity style={styles.numberBtn} onPress={() => updateField(activeDayIndex, ex.exerciseId, 'targetRepsMin', Math.max(1, (ex.targetRepsMin ?? 1) - 1))}>
                              <Text style={styles.numberBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.numberValue}>{ex.targetRepsMin}</Text>
                            <TouchableOpacity style={styles.numberBtn} onPress={() => updateField(activeDayIndex, ex.exerciseId, 'targetRepsMin', Math.min((ex.targetRepsMax ?? 99) - 1, (ex.targetRepsMin ?? 1) + 1))}>
                              <Text style={styles.numberBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={styles.repsSep}>–</Text>
                        <View style={styles.repsRangeInput}>
                          <Text style={styles.repsRangeHint}>máx</Text>
                          <View style={styles.numberFieldRow}>
                            <TouchableOpacity style={styles.numberBtn} onPress={() => updateField(activeDayIndex, ex.exerciseId, 'targetRepsMax', Math.max((ex.targetRepsMin ?? 1) + 1, (ex.targetRepsMax ?? 12) - 1))}>
                              <Text style={styles.numberBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.numberValue}>{ex.targetRepsMax}</Text>
                            <TouchableOpacity style={styles.numberBtn} onPress={() => updateField(activeDayIndex, ex.exerciseId, 'targetRepsMax', Math.min(100, (ex.targetRepsMax ?? 12) + 1))}>
                              <Text style={styles.numberBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <NumberField label="Segundos" value={ex.targetDurationSeconds ?? 30} onChange={(v) => updateField(activeDayIndex, ex.exerciseId, 'targetDurationSeconds', v)} min={5} max={600} />
                  )}
                </View>

                <TouchableOpacity style={styles.restSelector} onPress={() => setRestPickerFor(ex.exerciseId)}>
                  <Text style={styles.restSelectorLabel}>⏱ Descanso</Text>
                  <View style={styles.restSelectorValue}>
                    <Text style={styles.restSelectorValueText}>{restLabel(ex.restBetweenSetsSeconds)}</Text>
                    <Text style={styles.restChevron}>▾</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}

            <ExercisePicker coachId={user?.id ?? ''} onSelect={(ex) => addExerciseToDay(activeDayIndex, ex)} selectedIds={activeDay.exercises.map((e) => e.exerciseId)} />
          </View>
        )}
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

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; }) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.numberFieldLabel}>{label}</Text>
      <View style={styles.numberFieldRow}>
        <TouchableOpacity style={styles.numberBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.numberBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.numberValue}>{value}</Text>
        <TouchableOpacity style={styles.numberBtn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={styles.numberBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDotActive: { backgroundColor: Colors.primary },
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minWidth: 80, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  scroll: { flex: 1 },
  section: { padding: Spacing.lg, gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md },
  inputMultiline: { height: 88, textAlignVertical: 'top' },
  dayTabs: { marginBottom: Spacing.md },
  dayTab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.sm, backgroundColor: Colors.surface },
  dayTabActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySubtle },
  dayTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  dayTabTextActive: { color: Colors.primary },
  dayTabBadge: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  dayTabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addDayButton: { borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceMuted },
  addDayText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  exerciseCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md },
  exerciseCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseCardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  removeText: { color: Colors.textMuted, fontSize: FontSize.md, padding: 4 },
  exerciseFields: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  numberField: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  numberFieldLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 1, textAlign: 'center' },
  numberFieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  numberBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  numberBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
  numberValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, minWidth: 28, textAlign: 'center' },
  repsRangeField: { flex: 2, alignItems: 'center', gap: Spacing.xs },
  repsRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repsRangeInput: { alignItems: 'center', gap: 2 },
  repsRangeHint: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  repsSep: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: '700', marginTop: 14 },
  restSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  restSelectorLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  restSelectorValue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  restSelectorValueText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  restChevron: { fontSize: 12, color: Colors.primary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingBottom: Spacing.xl, maxHeight: '60%' },
  pickerTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerOptionSelected: { backgroundColor: Colors.primarySubtle },
  pickerOptionText: { fontSize: FontSize.md, color: Colors.textPrimary },
  pickerOptionTextSelected: { color: Colors.primary, fontWeight: '700' },
  checkmark: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
});
