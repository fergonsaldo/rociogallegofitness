import { View, Text, StyleSheet } from 'react-native';
import { WorkoutHistoryEntry } from '@/application/athlete/ProgressUseCases';
import { Colors, FontSize, Spacing, BorderRadius } from '@/shared/constants/theme';

const WEEKS      = 12;
const DAYS       = 7;
const CELL_SIZE  = 14;
const CELL_GAP   = 3;
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface ConsistencyChartProps {
  history: WorkoutHistoryEntry[];
}

interface WeekDay { date: Date; hasWorkout: boolean; isToday: boolean }

function buildGrid(history: WorkoutHistoryEntry[]): WeekDay[][] {
  const workoutDays = new Set(
    history.map((e) =>
      e.session.startedAt.toISOString().split('T')[0],
    ),
  );

  const today    = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Anchor to last Sunday so the grid always ends on a complete week
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - today.getDay() + 7); // next Sunday

  const weeks: WeekDay[][] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const week: WeekDay[] = [];
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - w * 7 - (DAYS - 1 - d));
      const dateStr = date.toISOString().split('T')[0];
      week.push({ date, hasWorkout: workoutDays.has(dateStr), isToday: dateStr === todayStr });
    }
    weeks.push(week);
  }
  return weeks;
}

function computeStreak(history: WorkoutHistoryEntry[]): number {
  if (history.length === 0) return 0;
  const days = [...new Set(
    history.map((e) => e.session.startedAt.toISOString().split('T')[0]),
  )].sort().reverse();

  const today    = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak starts only if trained today or yesterday
  if (days[0] !== today && days[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export function ConsistencyChart({ history }: ConsistencyChartProps) {
  const grid   = buildGrid(history);
  const streak = computeStreak(history);

  // Sessions this month
  const thisMonth   = new Date().getMonth();
  const thisYear    = new Date().getFullYear();
  const monthCount  = history.filter((e) => {
    const d = e.session.startedAt;
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  return (
    <View style={styles.container}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>🔥 Racha actual</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{monthCount}</Text>
          <Text style={styles.statLabel}>📅 Este mes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>🏋️ Total</Text>
        </View>
      </View>

      {/* Heatmap */}
      <Text style={styles.heatmapTitle}>ÚLTIMAS 12 SEMANAS</Text>
      <View style={styles.heatmap}>
        {/* Day labels column */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((label) => (
            <Text key={label} style={styles.dayLabel}>{label}</Text>
          ))}
        </View>

        {/* Week columns */}
        <View style={styles.weeksRow}>
          {grid.map((week, wi) => (
            <View key={wi} style={styles.weekCol}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    day.hasWorkout && styles.cellActive,
                    day.isToday   && styles.cellToday,
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.cell, styles.legendCell]} />
        <Text style={styles.legendText}>Sin entreno</Text>
        <View style={[styles.cell, styles.cellActive, styles.legendCell]} />
        <Text style={styles.legendText}>Con entreno</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.md, alignItems: 'center', gap: 2,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },

  heatmapTitle: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  heatmap: { flexDirection: 'row', gap: Spacing.xs },
  dayLabels: { gap: CELL_GAP, paddingTop: 1 },
  dayLabel: { height: CELL_SIZE, fontSize: 9, color: Colors.textMuted, lineHeight: CELL_SIZE, textAlignVertical: 'center' },
  weeksRow: { flexDirection: 'row', gap: CELL_GAP },
  weekCol:  { gap: CELL_GAP },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: 3,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cellActive: { backgroundColor: Colors.athlete, borderColor: Colors.athlete },
  cellToday:  { borderColor: Colors.primary, borderWidth: 2 },

  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendCell: { width: CELL_SIZE, height: CELL_SIZE },
  legendText: { fontSize: 10, color: Colors.textMuted, marginRight: Spacing.sm },
});
