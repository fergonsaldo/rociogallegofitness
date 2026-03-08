import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ExerciseProgressionPoint } from '@/application/athlete/ProgressUseCases';
import { Colors, FontSize, Spacing, BorderRadius } from '@/shared/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;
const CHART_HEIGHT = 160;
const PADDING = { top: 16, right: 16, bottom: 32, left: 44 };

interface ProgressionChartProps {
  points: ExerciseProgressionPoint[];
  metric: 'oneRepMax' | 'volume';
  accentColor?: string;
}

/**
 * SVG line chart showing progression over time.
 * Renders estimated 1RM or total volume depending on `metric` prop.
 * Uses react-native-svg — no third party chart library needed.
 */
export function ProgressionChart({
  points,
  metric,
  accentColor = Colors.primary,
}: ProgressionChartProps) {
  if (points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {points.length === 0
            ? 'No data yet — complete a workout to see your progress'
            : 'Need at least 2 sessions to draw a chart'}
        </Text>
      </View>
    );
  }

  const values = points.map((p) =>
    metric === 'oneRepMax' ? (p.estimatedOneRepMaxKg ?? 0) : p.totalVolumeKg
  );

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const plotW = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const toX = (i: number) => PADDING.left + (i / (points.length - 1)) * plotW;
  const toY = (v: number) => PADDING.top + plotH - ((v - minVal) / range) * plotH;

  // Build SVG path
  const linePath = points
    .map((p, i) => {
      const x = toX(i);
      const y = toY(values[i]);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Area fill path (closes back to bottom)
  const areaPath =
    linePath +
    ` L ${toX(points.length - 1)} ${PADDING.top + plotH}` +
    ` L ${toX(0)} ${PADDING.top + plotH} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [minVal, minVal + range / 2, maxVal].map((v) => ({
    label: metric === 'volume' ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`,
    y: toY(v),
  }));

  // X-axis labels (first, middle, last)
  const xIndices = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const xLabels = xIndices.map((i) => ({
    label: formatDate(points[i].date),
    x: toX(i),
  }));

  const gradientId = `grad-${metric}`;

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <Line
            key={i}
            x1={PADDING.left}
            y1={tick.y}
            x2={PADDING.left + plotW}
            y2={tick.y}
            stroke={Colors.border}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <Path d={linePath} fill="none" stroke={accentColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={toX(i)}
            cy={toY(values[i])}
            r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? accentColor : Colors.surface}
            stroke={accentColor}
            strokeWidth={2}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <SvgText
            key={i}
            x={PADDING.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={9}
            fill={Colors.textMuted}
          >
            {tick.label}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <SvgText
            key={i}
            x={label.x}
            y={CHART_HEIGHT - 4}
            textAnchor="middle"
            fontSize={9}
            fill={Colors.textMuted}
          >
            {label.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  empty: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
