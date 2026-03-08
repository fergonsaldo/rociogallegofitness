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
  const { selectedRoutine, isLoading, error, fetchRoutineById } = useRoutineStore();

  console.log('[RoutineDetail] render — id:', id, 'isLoading:', isLoading, 'error:', error);
  console.log('[RoutineDetail] selectedRoutine:', selectedRoutine?.id, selectedRoutine?.name);

  useEffect(() => {
    console.log('[RoutineDetail] useEffect — id:', id, 'selectedRoutine:', selectedRoutine?.id);
    if (id && (!selectedRoutine || selectedRoutine.id !== id)) {
      fetchRoutineById(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    console.error('[RoutineDetail] error state:', error);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorMsg}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedRoutine) {
    console.warn('[RoutineDetail] no selectedRoutine, id:', id);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorTitle}>Rutina no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('[RoutineDetail] days:', selectedRoutine.days?.length);

  const totalExercises = selectedRoutine.days.reduce((s, d) => s + d.exercises.length, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.assignButton}>
          <Text style={styles.assignButtonText}>Asignar a atleta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.routineName}>{selectedRoutine.name}</Text>
          {selectedRoutine.description && (
            <Text style={styles.routineDescription}>{selectedRoutine.description}</Text>
          )}
          <View style={styles.metaRow}>
            <MetaPill emoji="📅" label={`${selectedRoutine.days.length} días`} />
            <MetaPill emoji="🏋️" label={`${totalExercises} ejercicios`} />
            {selectedRoutine.durationWeeks && (
              <MetaPill emoji="📆" label={`${selectedRoutine.durationWeeks} semanas`} />
            )}
          </View>
        </View>

        <View style={styles.daysContainer}>
          {selectedRoutine.days.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{day.dayNumber}</Text>
                </View>
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayExCount}>{day.exercises.length} ej.</Text>
              </View>

              {day.exercises.map((ex) => {
                const exercise = findExerciseById(ex.exerciseId);
                console.log('[RoutineDetail] exercise:', ex.exerciseId, '→', exercise?.name);
                return (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseOrder}>
                      <Text style={styles.exerciseOrderText}>{ex.order}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise?.name ?? ex.exerciseId}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.targetSets} series ·{' '}
                        {ex.targetReps ? `${ex.targetReps} reps` : `${ex.targetDurationSeconds}s`}
                        {' '}· {ex.restBetweenSetsSeconds}s descanso
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  assignButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  assignButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  headerCard: {
    backgroundColor: Colors.surface, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
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
  exerciseMuscle: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', textTransform: 'capitalize' },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  errorMsg: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
