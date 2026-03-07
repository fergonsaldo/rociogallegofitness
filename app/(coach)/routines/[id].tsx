import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { findExerciseById } from '../../../src/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedRoutine, isLoading, fetchRoutineById } = useRoutineStore();

  useEffect(() => {
    if (id && (!selectedRoutine || selectedRoutine.id !== id)) {
      fetchRoutineById(id);
    }
  }, [id]);

  if (isLoading || !selectedRoutine) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const totalExercises = selectedRoutine.days.reduce((s, d) => s + d.exercises.length, 0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignButton}>
          <Text style={styles.assignButtonText}>Assign to Athlete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.routineName}>{selectedRoutine.name}</Text>
          {selectedRoutine.description && (
            <Text style={styles.routineDescription}>{selectedRoutine.description}</Text>
          )}
          <View style={styles.metaRow}>
            <MetaPill emoji="📅" label={`${selectedRoutine.days.length} days`} />
            <MetaPill emoji="🏋️" label={`${totalExercises} exercises`} />
            {selectedRoutine.durationWeeks && (
              <MetaPill emoji="📆" label={`${selectedRoutine.durationWeeks} weeks`} />
            )}
          </View>
        </View>

        {/* Days */}
        <View style={styles.daysContainer}>
          {selectedRoutine.days.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{day.dayNumber}</Text>
                </View>
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayExCount}>{day.exercises.length} ex.</Text>
              </View>

              {day.exercises.map((ex) => {
                const exercise = findExerciseById(ex.exerciseId);
                return (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseOrder}>
                      <Text style={styles.exerciseOrderText}>{ex.order}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise?.name ?? ex.exerciseId}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.targetSets} sets ·{' '}
                        {ex.targetReps
                          ? `${ex.targetReps} reps`
                          : `${ex.targetDurationSeconds}s`}
                        {' '}· {ex.restBetweenSetsSeconds}s rest
                      </Text>
                    </View>
                    {exercise && (
                      <Text style={styles.exerciseMuscle}>
                        {exercise.primaryMuscles[0]}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
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
  assignButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  assignButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  headerCard: {
    backgroundColor: Colors.surface, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  routineName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  routineDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  pillEmoji: { fontSize: 12 },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  daysContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  dayCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.primarySubtle,
  },
  dayBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  dayName: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  dayExCount: { fontSize: FontSize.xs, color: Colors.textSecondary },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  exerciseOrder: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center',
  },
  exerciseOrderText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  exerciseMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  exerciseMuscle: {
    fontSize: FontSize.xs, color: Colors.primary,
    fontWeight: '600', textTransform: 'capitalize',
  },
});
