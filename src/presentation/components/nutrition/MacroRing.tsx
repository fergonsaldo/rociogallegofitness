import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSize, Spacing, BorderRadius } from '../../../shared/constants/theme';

interface MacroRingProps {
  /** 0 to 1 */
  progress: number;
  value: number;
  target: number;
  unit: string;
  label: string;
  color: string;
  size?: number;
}

/**
 * Circular progress ring for a single macro.
 * Turns orange when > 90%, red when > 100%.
 */
export function MacroRing({
  progress, value, target, unit, label, color, size = 72,
}: MacroRingProps) {
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clampedProgress = Math.min(1, progress);
  const dash = clampedProgress * circumference;

  const ringColor = progress > 1 ? Colors.error : progress > 0.9 ? Colors.warning : color;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={Colors.border} strokeWidth={strokeWidth} fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={ringColor} strokeWidth={strokeWidth}
          fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color: ringColor }]}>
          {Math.round(value)}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.target}>/ {target}{unit}</Text>
    </View>
  );
}

// ── MacroBar ─────────────────────────────────────────────────────────────────

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}

/**
 * Horizontal progress bar for a single macro — used in compact views.
 */
export function MacroBar({ label, consumed, target, unit, color }: MacroBarProps) {
  const progress = Math.min(1, target > 0 ? consumed / target : 0);
  const overTarget = consumed > target;

  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, overTarget && styles.barValueOver]}>
          {Math.round(consumed)} / {target} {unit}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, progress * 100)}%`,
              backgroundColor: overTarget ? Colors.error : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── MacroSummaryCard ──────────────────────────────────────────────────────────

interface MacroSummaryCardProps {
  calories: { consumed: number; target: number; progress: number };
  protein:  { consumed: number; target: number; progress: number };
  carbs:    { consumed: number; target: number; progress: number };
  fat:      { consumed: number; target: number; progress: number };
}

/**
 * Full summary card with calorie ring + 3 macro bars.
 */
export function MacroSummaryCard({ calories, protein, carbs, fat }: MacroSummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <MacroRing
          progress={calories.progress}
          value={calories.consumed}
          target={calories.target}
          unit="kcal"
          label="Calories"
          color={Colors.primary}
          size={100}
        />
        <View style={styles.summaryBars}>
          <MacroBar label="Protein" consumed={protein.consumed} target={protein.target} unit="g" color={Colors.primary} />
          <MacroBar label="Carbs"   consumed={carbs.consumed}   target={carbs.target}   unit="g" color={Colors.athlete} />
          <MacroBar label="Fat"     consumed={fat.consumed}     target={fat.target}     unit="g" color={Colors.warning} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  center: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  value: { fontSize: FontSize.md, fontWeight: '800' },
  unit: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  target: { fontSize: 9, color: Colors.textMuted },
  barContainer: { gap: 4 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  barValue: { fontSize: FontSize.xs, color: Colors.textSecondary },
  barValueOver: { color: Colors.error, fontWeight: '700' },
  barTrack: {
    height: 6, backgroundColor: Colors.border,
    borderRadius: 3, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  summaryBars: { flex: 1, gap: Spacing.md },
});
