import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useBodyMetricStore } from '../../../src/presentation/stores/bodyMetricStore';
import { BodyMetricChart, BodyMetricField } from '../../../src/presentation/components/athlete/BodyMetricChart';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

const FIELDS: { key: BodyMetricField; label: string; unit: string }[] = [
  { key: 'weightKg',       label: Strings.bodyMetricWeight, unit: Strings.bodyMetricUnitKg      },
  { key: 'waistCm',        label: Strings.bodyMetricWaist,  unit: Strings.bodyMetricUnitCm      },
  { key: 'hipCm',          label: Strings.bodyMetricHip,    unit: Strings.bodyMetricUnitCm      },
  { key: 'bodyFatPercent', label: Strings.bodyMetricFat,    unit: Strings.bodyMetricUnitPercent },
];

export default function BodyChartsScreen() {
  const router    = useRouter();
  const { metrics, summary } = useBodyMetricStore();
  const [activeField, setActiveField] = useState<BodyMetricField>('weightKg');

  const active = FIELDS.find((f) => f.key === activeField)!;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Evolución corporal</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selector de métrica */}
        <View style={styles.selectorRow}>
          {FIELDS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.selectorPill, activeField === f.key && styles.selectorPillActive]}
              onPress={() => setActiveField(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectorText, activeField === f.key && styles.selectorTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gráfico */}
        <View style={styles.chartCard}>
          <BodyMetricChart metrics={metrics} field={activeField} />
        </View>

        {/* Stats del campo seleccionado */}
        {summary.latest && summary.initial && (
          <View style={styles.statsRow}>
            {[
              { label: Strings.bodyMetricInitial, value: summary.initial[activeField] },
              { label: Strings.bodyMetricCurrent, value: summary.latest[activeField]  },
              { label: Strings.bodyMetricChange,  value: summary.delta[activeField],  isDelta: true },
            ].map(({ label, value, isDelta }) => {
              if (value === undefined || value === null) return null;
              const positive = (value as number) > 0;
              return (
                <View key={label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{label}</Text>
                  <Text style={[
                    styles.statValue,
                    isDelta && (positive ? styles.deltaUp : styles.deltaDown),
                  ]}>
                    {isDelta && positive ? '+' : ''}{value} {active.unit}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Historial de registros */}
        <Text style={styles.historyTitle}>REGISTROS</Text>
        {metrics.length === 0 ? (
          <Text style={styles.emptyText}>{Strings.bodyMetricsEmpty}</Text>
        ) : (
          [...metrics].reverse().map((m) => {
            const val = m[activeField];
            if (val === undefined) return null;
            return (
              <View key={m.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {m.recordedAt.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.historyValue}>{val} {active.unit}</Text>
              </View>
            );
          })
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', width: 60 },
  title:   { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  selectorPill: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  selectorPillActive: { backgroundColor: Colors.athleteSubtle, borderColor: Colors.athlete },
  selectorText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  selectorTextActive: { color: Colors.athlete },
  chartCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', gap: 2 },
  statLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  deltaUp:   { color: Colors.error },
  deltaDown: { color: Colors.success },
  historyTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5 },
  emptyText:    { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyDate:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  historyValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
});
