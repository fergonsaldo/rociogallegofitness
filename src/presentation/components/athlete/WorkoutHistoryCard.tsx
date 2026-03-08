import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutHistoryEntry } from '@/application/athlete/ProgressUseCases';
import { Colors, Spacing, FontSize, BorderRadius } from '@/shared/constants/theme';
import { Strings } from '@/shared/constants/strings';

interface WorkoutHistoryCardProps {
  entry: WorkoutHistoryEntry;
  onPress: (entry: WorkoutHistoryEntry) => void;
}

export function WorkoutHistoryCard({ entry, onPress }: WorkoutHistoryCardProps) {
  const { session, totalVolumeKg, totalSets, durationMinutes, exerciseCount } = entry;

  const dateLabel = session.startedAt.toLocaleDateString('es', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const timeLabel = session.startedAt.toLocaleTimeString('es', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(entry)} activeOpacity={0.7}>
      {/* Left accent */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>{dateLabel}</Text>
            <Text style={styles.time}>{timeLabel}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>⏱ {durationMinutes}m</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat emoji="🔁" value={String(totalSets)} label={Strings.labelSets} />
          <Stat emoji="🏋️" value={String(exerciseCount)} label={Strings.labelExercises} />
          <Stat emoji="⚡️" value={`${Math.round(totalVolumeKg / 1000 * 10) / 10}k`} label="Vol. kg" />
        </View>

        {session.notes && (
          <Text style={styles.notes} numberOfLines={1}>{session.notes}</Text>
        )}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  accentBar: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.athlete },
  content: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  date: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  time: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  durationBadge: {
    backgroundColor: Colors.athleteSubtle, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: `${Colors.athlete}30`,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  durationText: { fontSize: FontSize.xs, color: Colors.athlete, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: Spacing.lg },
  stat: { alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 14 },
  statValue: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 0.5 },
  notes: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  chevron: { fontSize: 22, color: Colors.textMuted, paddingRight: Spacing.md },
});
