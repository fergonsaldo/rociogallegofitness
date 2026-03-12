import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useBodyMetricStore } from '../../../src/presentation/stores/bodyMetricStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

interface FieldState { value: string; error: string | null }

function NumericField({ label, unit, state, onChange }: {
  label: string; unit: string;
  state: FieldState; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, state.error && styles.inputRowError]}>
        <TextInput
          style={styles.input}
          value={state.value}
          onChangeText={onChange}
          placeholder="—"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
      {state.error && <Text style={styles.errorText}>{state.error}</Text>}
    </View>
  );
}

export default function BodyMetricScreen() {
  const router             = useRouter();
  const { user }           = useAuthStore();
  const { isLoading, create } = useBodyMetricStore();

  const [weight,  setWeight]  = useState<FieldState>({ value: '', error: null });
  const [waist,   setWaist]   = useState<FieldState>({ value: '', error: null });
  const [hip,     setHip]     = useState<FieldState>({ value: '', error: null });
  const [fat,     setFat]     = useState<FieldState>({ value: '', error: null });
  const [notes,   setNotes]   = useState('');

  const parseField = (raw: string): number | undefined => {
    const n = parseFloat(raw.replace(',', '.'));
    return isNaN(n) ? undefined : n;
  };

  const validate = (): boolean => {
    let ok = true;
    const validators: [FieldState, (s: FieldState) => void, number, number][] = [
      [weight, setWeight, 0,  500],
      [waist,  setWaist,  0,  300],
      [hip,    setHip,    0,  300],
      [fat,    setFat,    1,  70 ],
    ];

    validators.forEach(([field, setter, min, max]) => {
      if (!field.value.trim()) return;
      const n = parseFloat(field.value.replace(',', '.'));
      if (isNaN(n) || n <= min || n > max) {
        setter({ ...field, error: `Valor entre ${min} y ${max}` });
        ok = false;
      }
    });

    const allEmpty = [weight, waist, hip, fat].every((f) => !f.value.trim());
    if (allEmpty) {
      Alert.alert('Error', 'Introduce al menos una medición');
      ok = false;
    }
    return ok;
  };

  const handleSave = async () => {
    if (!user?.id || !validate()) return;
    const created = await create({
      athleteId:      user.id,
      recordedAt:     new Date(),
      weightKg:       parseField(weight.value),
      waistCm:        parseField(waist.value),
      hipCm:          parseField(hip.value),
      bodyFatPercent: parseField(fat.value),
      notes:          notes.trim() || undefined,
    });
    if (created) router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{Strings.bodyMetricsTitle}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Mediciones del día</Text>

        <NumericField label={Strings.bodyMetricWeight} unit={Strings.bodyMetricUnitKg}
          state={weight} onChange={(v) => setWeight({ value: v, error: null })} />
        <NumericField label={Strings.bodyMetricWaist}  unit={Strings.bodyMetricUnitCm}
          state={waist}  onChange={(v) => setWaist({ value: v, error: null })} />
        <NumericField label={Strings.bodyMetricHip}    unit={Strings.bodyMetricUnitCm}
          state={hip}    onChange={(v) => setHip({ value: v, error: null })} />
        <NumericField label={Strings.bodyMetricFat}    unit={Strings.bodyMetricUnitPercent}
          state={fat}    onChange={(v) => setFat({ value: v, error: null })} />

        <View style={styles.field}>
          <Text style={styles.label}>{Strings.bodyMetricNotes}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas opcionales…"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.saveButtonText}>{Strings.bodyMetricSave}</Text>
          }
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', width: 60 },
  title:   { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
  field:   { gap: Spacing.xs },
  label:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputRowError: { borderColor: Colors.error },
  input:   { flex: 1, fontSize: FontSize.lg, color: Colors.textPrimary, paddingVertical: Spacing.md, fontWeight: '600' },
  notesInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, minHeight: 80, paddingTop: Spacing.md },
  unit:    { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600', paddingLeft: Spacing.sm },
  errorText: { fontSize: FontSize.xs, color: Colors.error },
  saveButton: { backgroundColor: Colors.athlete, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md, shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
