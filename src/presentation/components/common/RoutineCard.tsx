import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Routine } from '../../../domain/entities/Routine';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../shared/constants/theme';

interface RoutineCardProps {
  routine: Routine;
  onPress: (routine: Routine) => void;
  accentColor?: string;
  showCoachBadge?: boolean;
}

export function RoutineCard({
  routine,
  onPress,
  accentColor = Colors.primary,
  showCoachBadge = false,
}: RoutineCardProps) {
  const totalExercises = routine.days.reduce(
    (sum, day) => sum + day.exercises.length,
    0
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(routine)}
      activeOpacity={0.7}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{routine.name}</Text>
          {routine.durationWeeks && (
            <View style={[styles.badge, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
              <Text style={[styles.badgeText, { color: accentColor }]}>
                {routine.durationWeeks}w
              </Text>
            </View>
          )}
        </View>

        {routine.description && (
          <Text style={styles.description} numberOfLines={2}>
            {routine.description}
          </Text>
        )}

        <View style={styles.meta}>
          <MetaPill emoji="📅" label={`${routine.days.length} day${routine.days.length !== 1 ? 's' : ''}`} />
          <MetaPill emoji="🏋️" label={`${totalExercises} exercise${totalExercises !== 1 ? 's' : ''}`} />
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  pillEmoji: { fontSize: 11 },
  pillLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: Colors.textMuted,
    paddingRight: Spacing.md,
  },
});
