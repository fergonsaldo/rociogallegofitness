import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WorkoutLocalRepository } from '../../../src/infrastructure/database/local/WorkoutLocalRepository';
import { WorkoutSession } from '../../../src/domain/entities/WorkoutSession';
import { findExerciseById } from '../../../src/shared/constants/exercises';
import { calculateTotalVolume } from '../../../src/domain/value-objects/Volume';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

const repo = new WorkoutLocalRepository();

export default function SessionDetailScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      repo.getSessionById(sessionId).then((s) => {
        setSession(s);
        setLoading(false);
      });
    }
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={Colors.athlete} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text style={styles.errorText}>Session not found</Text></View>
      </SafeAreaView>
    );
  }

  // Aggregate sets per exercise
  const exerciseIds = [...new Set(session.sets.map((s) => s.exerciseId))];
  const durationMinutes = session.finishedAt
    ? Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000)
    : 0;

  const repsSets = session.sets
    .filter((s) => s.performance.type === 'reps')
    .map((s) => ({ reps: (s.performance as any).reps, weightKg: (s.performance as any).weightKg }));
  const totalVolumeKg = calculateTotalVolume(repsSets);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.sessionDate}>
            {session.startedAt.toLocaleDateString('es', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.sessionTime}>
            {session.startedAt.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <View style={styles.statsRow}>
            <StatBadge emoji="⏱" value={`${durationMinutes}m`} label={Strings.labelDuration} />
            <StatBadge emoji="🔁" value={String(session.sets.length)} label={Strings.labelSets} />
            <StatBadge emoji="🏋️" value={String(exerciseIds.length)} label={Strings.labelExercises} />
            <StatBadge emoji="⚡️" value={`${Math.round(totalVolumeKg)}`} label="Vol. kg" />
          </View>

          {session.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesText}>"{session.notes}"</Text>
            </View>
          )}
        </View>

        {/* Per-exercise breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXERCISES</Text>
          {exerciseIds.map((exerciseId) => {
            const exercise = findExerciseById(exerciseId);
            const exerciseSets = session.sets.filter((s) => s.exerciseId === exerciseId);

            return (
              <View key={exerciseId} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise?.name ?? Strings.fallbackUnknown}</Text>
                  <Text style={styles.exerciseMuscle}>{exercise?.primaryMuscles[0]}</Text>
                </View>

                {/* Set rows */}
                <View style={styles.setsTable}>
                  <View style={styles.setsTableHeader}>
                    <Text style={styles.colLabel}>SET</Text>
                    <Text style={styles.colLabel}>PERFORMANCE</Text>
                    <Text style={styles.colLabel}>VOLUME</Text>
                  </View>
                  {exerciseSets.map((s, i) => {
                    const isReps = s.performance.type === 'reps';
                    const perfLabel = isReps
                      ? `${(s.performance as any).weightKg} kg × ${(s.performance as any).reps}`
                      : `${(s.performance as any).durationSeconds}s hold`;
                    const volume = isReps
                      ? `${(s.performance as any).weightKg * (s.performance as any).reps} kg`
                      : '—';

                    return (
                      <View key={s.id} style={[styles.setRow, i % 2 === 0 && styles.setRowAlt]}>
                        <View style={styles.setBadge}>
                          <Text style={styles.setBadgeText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.colValue}>{perfLabel}</Text>
                        <Text style={styles.colVolume}>{volume}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBadge({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.textSecondary, fontSize: FontSize.md },
  topbar: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  headerCard: {
    backgroundColor: Colors.surface, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: Spacing.xs,
  },
  sessionDate: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  sessionTime: { fontSize: FontSize.sm, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, flexWrap: 'wrap' },
  statBadge: {
    backgroundColor: Colors.athleteSubtle, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: `${Colors.athlete}25`,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', gap: 2, minWidth: 64,
  },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 1 },
  notes: {
    marginTop: Spacing.sm, backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.sm, padding: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.athlete,
  },
  notesText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  section: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  exerciseCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.athleteSubtle,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  exerciseName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  exerciseMuscle: { fontSize: FontSize.xs, color: Colors.athlete, fontWeight: '600', textTransform: 'capitalize' },
  setsTable: { paddingHorizontal: Spacing.md },
  setsTableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.xs, gap: Spacing.md,
  },
  colLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1.5, fontWeight: '600', flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  setRowAlt: { backgroundColor: Colors.surfaceMuted },
  setBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  setBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  colValue: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  colVolume: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right' },
});
