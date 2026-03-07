import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Exercise } from '../../../domain/entities/Exercise';
import { ExerciseSet } from '../../../domain/entities/ExerciseSet';
import { Colors, FontSize, Spacing, BorderRadius } from '../../../shared/constants/theme';

interface SetLoggerProps {
  exercise: Exercise;
  setNumber: number;
  previousSet?: ExerciseSet; // last set for this exercise — shown as hint
  onLog: (performance: { type: 'reps'; reps: number; weightKg: number } | { type: 'isometric'; durationSeconds: number }) => void;
}

/**
 * Input row for logging one set.
 * Adapts UI based on exercise type: reps+weight or duration (isometric).
 */
export function SetLogger({ exercise, setNumber, previousSet, onLog }: SetLoggerProps) {
  const prevReps = previousSet?.performance.type === 'reps' ? String((previousSet.performance as any).reps) : '';
  const prevWeight = previousSet?.performance.type === 'reps' ? String((previousSet.performance as any).weightKg) : '';
  const prevDuration = previousSet?.performance.type === 'isometric' ? String((previousSet.performance as any).durationSeconds) : '';

  const [reps, setReps] = useState(prevReps);
  const [weight, setWeight] = useState(prevWeight);
  const [duration, setDuration] = useState(prevDuration || '30');

  const handleLog = () => {
    if (exercise.isIsometric) {
      const d = parseInt(duration, 10);
      if (!d || d < 1) return;
      onLog({ type: 'isometric', durationSeconds: d });
    } else {
      const r = parseInt(reps, 10);
      const w = parseFloat(weight);
      if (!r || r < 1 || isNaN(w) || w < 0) return;
      onLog({ type: 'reps', reps: r, weightKg: w });
    }
  };

  return (
    <View style={styles.row}>
      {/* Set number badge */}
      <View style={styles.setBadge}>
        <Text style={styles.setBadgeText}>{setNumber}</Text>
      </View>

      {exercise.isIsometric ? (
        <View style={styles.inputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SECONDS</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>
      ) : (
        <View style={styles.inputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>KG</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder={prevWeight || '0'}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <Text style={styles.separator}>×</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REPS</Text>
            <TextInput
              style={styles.input}
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              placeholder={prevReps || '—'}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logButton} onPress={handleLog} activeOpacity={0.8}>
        <Text style={styles.logButtonText}>✓</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  inputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inputGroup: { flex: 1, gap: 2 },
  inputLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 52,
  },
  separator: { fontSize: FontSize.lg, color: Colors.textMuted, fontWeight: '300' },
  logButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.athlete,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.athlete,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logButtonText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
});
