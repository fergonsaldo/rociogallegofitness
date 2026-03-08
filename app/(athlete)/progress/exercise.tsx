import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProgressStore } from '../../../src/presentation/stores/progressStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { ProgressionChart } from '../../../src/presentation/components/athlete/ProgressionChart';
import { findExerciseById } from '../../../src/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

type Metric = 'oneRepMax' | 'volume';

export default function ExerciseProgressionScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { user } = useAuthStore();
  const { progression, progressionLoading, fetchProgression } = useProgressStore();

  const [metric, setMetric] = useState<Metric>('oneRepMax');

  useEffect(() => {
    if (user?.id && exerciseId) fetchProgression(user.id, exerciseId);
  }, [user?.id, exerciseId]);

  const exercise = findExerciseById(exerciseId ?? '');
  const points = progression[exerciseId ?? ''] ?? [];

  // Compute summary stats from the progression data
  const validORM = points.map((p) => p.estimatedOneRepMaxKg ?? 0).filter(Boolean);
  const bestORM = validORM.length ? Math.max(...validORM) : null;
  const latestORM = validORM.length ? validORM[validORM.length - 1] : null;
  const ormTrend = validORM.length >= 2 ? latestORM! - validORM[validORM.length - 2] : null;

  const volumes = points.map((p) => p.totalVolumeKg);
  const bestVolume = volumes.length ? Math.max(...volumes) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.exerciseName}>{exercise?.name ?? Strings.fallbackExercise}</Text>
          {exercise && (
            <Text style={styles.exerciseMeta}>
              {exercise.primaryMuscles.join(', ')} · {points.length} sesión{points.length !== 1 ? 'es' : ''}
            </Text>
          )}
        </View>

        {/* Stats row */}
        {points.length > 0 && (
          <View style={styles.statsRow}>
            {bestORM && (
              <StatCard
                label="MEJOR 1RM"
                value={`${bestORM} kg`}
                sub={Strings.labelSubEstimated}
                accent={Colors.primary}
              />
            )}
            {ormTrend !== null && (
              <StatCard
                label={Strings.labelLastChange}
                value={`${ormTrend >= 0 ? '+' : ''}${ormTrend.toFixed(1)} kg`}
                sub={Strings.labelSubVsPrev}
                accent={ormTrend >= 0 ? Colors.success : Colors.error}
              />
            )}
            {bestVolume && (
              <StatCard
                label={Strings.labelBestVolume}
                value={`${Math.round(bestVolume)} kg`}
                sub={Strings.labelSubPerSession}
                accent={Colors.athlete}
              />
            )}
          </View>
        )}

        {/* Chart */}
        <View style={styles.chartSection}>
          {/* Metric toggle */}
          <View style={styles.metricToggle}>
            {(['oneRepMax', 'volume'] as Metric[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.metricPill, metric === m && styles.metricPillActive]}
                onPress={() => setMetric(m)}
              >
                <Text style={[styles.metricPillText, metric === m && styles.metricPillTextActive]}>
                  {m === 'oneRepMax' ? Strings.labelEstimated1RM : Strings.labelVolumeChart}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {progressionLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator color={Colors.athlete} />
            </View>
          ) : (
            <ProgressionChart
              points={points}
              metric={metric}
              accentColor={metric === 'oneRepMax' ? Colors.primary : Colors.athlete}
            />
          )}
        </View>

        {/* Session log */}
        {points.length > 0 && (
          <View style={styles.logSection}>
            <Text style={styles.logTitle}>REGISTRO DE SESIONES</Text>
            {[...points].reverse().map((point, i) => (
              <View key={`${point.sessionId}-${i}`} style={styles.logRow}>
                <View style={styles.logDateCol}>
                  <Text style={styles.logDate}>
                    {point.date.toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.logYear}>{point.date.getFullYear()}</Text>
                </View>
                <View style={styles.logStats}>
                  {point.bestWeightKg !== undefined && (
                    <LogStat label={Strings.labelBest} value={`${point.bestWeightKg} kg × ${point.bestReps}`} />
                  )}
                  {point.estimatedOneRepMaxKg !== undefined && (
                    <LogStat label="Est. 1RM" value={`${point.estimatedOneRepMaxKg} kg`} highlight />
                  )}
                  <LogStat label={Strings.labelVolume} value={`${Math.round(point.totalVolumeKg)} kg`} />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Text style={[styles.statCardValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statCardSub}>{sub}</Text>
    </View>
  );
}

function LogStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.logStat}>
      <Text style={styles.logStatLabel}>{label}</Text>
      <Text style={[styles.logStatValue, highlight && { color: Colors.primary, fontWeight: '800' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topbar: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  headerSection: { padding: Spacing.lg, paddingBottom: 0 },
  exerciseName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  exerciseMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsRow: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statCardLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 1.5, fontWeight: '600' },
  statCardValue: { fontSize: FontSize.lg, fontWeight: '800' },
  statCardSub: { fontSize: 9, color: Colors.textMuted },
  chartSection: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  metricToggle: { flexDirection: 'row', gap: Spacing.sm },
  metricPill: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceMuted,
  },
  metricPillActive: { borderColor: Colors.athlete, backgroundColor: Colors.athleteSubtle },
  metricPillText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  metricPillTextActive: { color: Colors.athlete },
  chartLoading: { height: 160, alignItems: 'center', justifyContent: 'center' },
  logSection: {
    margin: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  logTitle: {
    fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  logDateCol: { width: 48, alignItems: 'center' },
  logDate: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  logYear: { fontSize: 9, color: Colors.textMuted },
  logStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  logStat: { gap: 1 },
  logStatLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1 },
  logStatValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
});
