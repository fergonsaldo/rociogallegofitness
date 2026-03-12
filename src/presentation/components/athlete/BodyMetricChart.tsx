import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { BodyMetric } from '@/domain/entities/BodyMetric';
import { Colors, FontSize, Spacing } from '@/shared/constants/theme';

export type BodyMetricField = 'weightKg' | 'waistCm' | 'hipCm' | 'bodyFatPercent';

const FIELD_LABELS: Record<BodyMetricField, string> = {
  weightKg:       'Peso (kg)',
  waistCm:        'Cintura (cm)',
  hipCm:          'Cadera (cm)',
  bodyFatPercent: 'Grasa corporal (%)',
};

interface BodyMetricChartProps {
  metrics: BodyMetric[];
  field:   BodyMetricField;
}

const CHART_WIDTH  = Dimensions.get('window').width - 48;
const CHART_HEIGHT = 180;
const PAD          = { top: 16, right: 16, bottom: 32, left: 40 };

export function BodyMetricChart({ metrics, field }: BodyMetricChartProps) {
  const points = metrics
    .filter((m) => m[field] !== undefined)
    .map((m) => ({ value: m[field] as number, date: m.recordedAt }));

  if (points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Necesitas al menos 2 registros para ver la gráfica</Text>
      </View>
    );
  }

  const values   = points.map((p) => p.value);
  const minVal   = Math.min(...values);
  const maxVal   = Math.max(...values);
  const range    = maxVal - minVal || 1;

  const innerW = CHART_WIDTH  - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top  - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (v: number) => PAD.top  + innerH - ((v - minVal) / range) * innerH;

  const polylinePoints = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');

  // Y-axis labels: min, mid, max
  const yLabels = [minVal, (minVal + maxVal) / 2, maxVal];

  // X-axis: show first and last date
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es', { day: 'numeric', month: 'short' });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{FIELD_LABELS[field]}</Text>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Y-axis gridlines + labels */}
        {yLabels.map((val, i) => {
          const y = toY(val);
          return (
            <View key={i}>
              <Line x1={PAD.left} y1={y} x2={CHART_WIDTH - PAD.right} y2={y}
                stroke={Colors.border} strokeWidth={1} strokeDasharray="4 4" />
              <SvgText x={PAD.left - 4} y={y + 4} textAnchor="end"
                fontSize={9} fill={Colors.textMuted}>
                {val % 1 === 0 ? val : val.toFixed(1)}
              </SvgText>
            </View>
          );
        })}

        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={Colors.athlete}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={toX(i)} cy={toY(p.value)}
            r={4}
            fill={Colors.athlete}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {/* X-axis: first and last date */}
        <SvgText x={toX(0)} y={CHART_HEIGHT - 6} textAnchor="middle"
          fontSize={9} fill={Colors.textMuted}>
          {fmtDate(points[0].date)}
        </SvgText>
        <SvgText x={toX(points.length - 1)} y={CHART_HEIGHT - 6} textAnchor="middle"
          fontSize={9} fill={Colors.textMuted}>
          {fmtDate(points[points.length - 1].date)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  title: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  empty: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});
