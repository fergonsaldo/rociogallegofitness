import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SessionSummary } from '@/application/athlete/WorkoutUseCases';
import { findExerciseById } from '@/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';
import { Strings } from '@/shared/constants/strings';

interface WorkoutSummaryModalProps {
  summary: SessionSummary;
  onClose: () => void;
}

/**
 * Full-screen modal shown immediately after finishing a workout.
 * Displays duration, total volume, sets and per-exercise 1RM estimates.
 */
export function WorkoutSummaryModal({ summary, onClose }: WorkoutSummaryModalProps) {
  const { totalVolumeKg, totalSets, durationMinutes, exerciseSummaries } = summary;

  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>¡Entrenamiento completado!</Text>
          <Text style={styles.subtitle}>Gran sesión, sigue así</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard emoji="⏱" value={`${durationMinutes}m`} label={Strings.labelDuration} />
          <StatCard emoji="🔁" value={String(totalSets)} label={Strings.labelTotalSets} />
          <StatCard emoji="⚡️" value={`${Math.round(totalVolumeKg).toLocaleString()}`} label={Strings.labelVolumeKg} />
        </View>

        {/* Per-exercise breakdown */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>DESGLOSE POR EJERCICIO</Text>
          {exerciseSummaries.map((ex) => {
            const exercise = findExerciseById(ex.exerciseId);
            return (
              <View key={ex.exerciseId} style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise?.name ?? Strings.fallbackUnknown}</Text>
                  <Text style={styles.exerciseSets}>{ex.sets} series completadas</Text>
                </View>
                {ex.estimatedOneRepMaxKg && (
                  <View style={styles.ormBadge}>
                    <Text style={styles.ormLabel}>1RM EST.</Text>
                    <Text style={styles.ormValue}>{ex.estimatedOneRepMaxKg} kg</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.doneButtonText}>Listo</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  emoji: { fontSize: 52, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 1 },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  exerciseSets: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  ormBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  ormLabel: { fontSize: 9, color: Colors.primary, letterSpacing: 1.5, fontWeight: '700' },
  ormValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  doneButton: {
    backgroundColor: Colors.primary,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700', letterSpacing: 1 },
});
