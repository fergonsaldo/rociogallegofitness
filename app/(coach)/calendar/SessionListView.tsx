import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCoachCalendarStore, ListFilters } from '../../../src/presentation/stores/coachCalendarStore';
import { CoachSession } from '../../../src/domain/entities/CoachSession';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_TYPES = [
  Strings.sessionTypeEntrenamiento,
  Strings.sessionTypeEvaluacion,
  Strings.sessionTypeSeguimiento,
  Strings.sessionTypeNutricion,
];

const MODALITIES: { label: string; value: 'online' | 'in_person' }[] = [
  { label: Strings.sessionFormModalityInPerson, value: 'in_person' },
  { label: Strings.sessionFormModalityOnline,   value: 'online' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function applyFilters(sessions: CoachSession[], filters: ListFilters): CoachSession[] {
  return sessions.filter((s) => {
    const typeOk     = filters.sessionTypes.length === 0 || filters.sessionTypes.includes(s.sessionType);
    const modalityOk = filters.modalities.length === 0   || filters.modalities.includes(s.modality);
    return typeOk && modalityOk;
  });
}

function computeMetrics(sessions: CoachSession[]) {
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const byType = SESSION_TYPES.map((type) => ({
    type,
    count: sessions.filter((s) => s.sessionType === type).length,
  }));
  const online    = sessions.filter((s) => s.modality === 'online').length;
  const in_person = sessions.filter((s) => s.modality === 'in_person').length;
  return { total: sessions.length, totalMinutes, byType, online, in_person };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterChip({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SessionRow({
  session, onDelete,
}: { session: CoachSession; onDelete: () => void }) {
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionDatecol}>
        <Text style={styles.sessionDateText}>{formatDateShort(session.scheduledAt)}</Text>
        <Text style={styles.sessionTimeText}>{formatTime(session.scheduledAt)}</Text>
        <Text style={styles.sessionDuration}>{session.durationMinutes} min</Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {session.title ?? session.sessionType}
        </Text>
        <View style={styles.sessionMeta}>
          <View style={[
            styles.modalityBadge,
            { backgroundColor: session.modality === 'online' ? '#E0F2FE' : '#DCFCE7' },
          ]}>
            <Text style={[
              styles.modalityText,
              { color: session.modality === 'online' ? '#0369A1' : '#166534' },
            ]}>
              {session.modality === 'online'
                ? Strings.sessionFormModalityOnline
                : Strings.sessionFormModalityInPerson}
            </Text>
          </View>
          {session.athleteName && (
            <Text style={styles.sessionAthlete} numberOfLines={1}>· {session.athleteName}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

function MetricsView({ sessions }: { sessions: CoachSession[] }) {
  const m = computeMetrics(sessions);
  const hours   = Math.floor(m.totalMinutes / 60);
  const minutes = m.totalMinutes % 60;
  const hoursLabel = minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;

  return (
    <View style={styles.metricsContainer}>
      {/* Totals */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{m.total}</Text>
          <Text style={styles.metricLabel}>{Strings.listMetricsTotalSessions}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{hoursLabel}</Text>
          <Text style={styles.metricLabel}>{Strings.listMetricsTotalHours}</Text>
        </View>
      </View>

      {/* By modality */}
      <View style={styles.metricsSection}>
        <Text style={styles.metricsSectionLabel}>{Strings.listMetricsByModality.toUpperCase()}</Text>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricCardGreen]}>
            <Text style={[styles.metricValue, { color: '#166534' }]}>{m.in_person}</Text>
            <Text style={[styles.metricLabel, { color: '#166534' }]}>{Strings.listMetricsInPerson}</Text>
          </View>
          <View style={[styles.metricCard, styles.metricCardBlue]}>
            <Text style={[styles.metricValue, { color: '#0369A1' }]}>{m.online}</Text>
            <Text style={[styles.metricLabel, { color: '#0369A1' }]}>{Strings.listMetricsOnline}</Text>
          </View>
        </View>
      </View>

      {/* By type */}
      <View style={styles.metricsSection}>
        <Text style={styles.metricsSectionLabel}>{Strings.listMetricsByType.toUpperCase()}</Text>
        {m.byType.map(({ type, count }) => (
          <View key={type} style={styles.typeRow}>
            <Text style={styles.typeLabel}>{type}</Text>
            <View style={styles.typeBarWrap}>
              <View style={[
                styles.typeBar,
                { width: m.total > 0 ? `${(count / m.total) * 100}%` : '0%' },
              ]} />
            </View>
            <Text style={styles.typeCount}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SessionListView({ coachId }: { coachId: string }) {
  const {
    rangeSessions, listFrom, listTo, listFilters,
    isLoadingRange, fetchRange, removeSession,
    setListFrom, setListTo, setListFilters,
  } = useCoachCalendarStore();

  const [subtab,        setSubtab]        = useState<'list' | 'metrics'>('list');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);

  useEffect(() => {
    if (coachId) fetchRange(coachId, listFrom, listTo);
  }, [coachId, listFrom, listTo]);

  const filtered = applyFilters(rangeSessions, listFilters);

  function toggleType(type: string) {
    const types = listFilters.sessionTypes.includes(type)
      ? listFilters.sessionTypes.filter((t) => t !== type)
      : [...listFilters.sessionTypes, type];
    setListFilters({ ...listFilters, sessionTypes: types });
  }

  function toggleModality(value: 'online' | 'in_person') {
    const mods = listFilters.modalities.includes(value)
      ? listFilters.modalities.filter((m) => m !== value)
      : [...listFilters.modalities, value];
    setListFilters({ ...listFilters, modalities: mods });
  }

  function handleFromChange(_: any, date?: Date) {
    if (Platform.OS === 'android') setShowFromPicker(false);
    if (date) setListFrom(date);
  }

  function handleToChange(_: any, date?: Date) {
    if (Platform.OS === 'android') setShowToPicker(false);
    if (date) setListTo(date);
  }

  function confirmDelete(session: CoachSession) {
    Alert.alert(
      Strings.calendarDeleteSessionTitle,
      Strings.calendarDeleteSessionMessage(session.title ?? session.sessionType),
      [
        { text: Strings.calendarDeleteCancel, style: 'cancel' },
        { text: Strings.calendarDeleteConfirm, style: 'destructive', onPress: () => removeSession(session.id) },
      ],
    );
  }

  return (
    <View style={styles.container}>

      {/* Sub-toggle Lista / Métricas */}
      <View style={styles.subtabRow}>
        <TouchableOpacity
          style={[styles.subtab, subtab === 'list' && styles.subtabActive]}
          onPress={() => setSubtab('list')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subtabText, subtab === 'list' && styles.subtabTextActive]}>
            {Strings.listSubtabList}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subtab, subtab === 'metrics' && styles.subtabActive]}
          onPress={() => setSubtab('metrics')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subtabText, subtab === 'metrics' && styles.subtabTextActive]}>
            {Strings.listSubtabMetrics}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Range selector */}
        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>{Strings.listRangeFrom}</Text>
            <TouchableOpacity style={styles.rangeBtn} onPress={() => setShowFromPicker(true)} activeOpacity={0.7}>
              <Text style={styles.rangeBtnText}>{formatDate(listFrom)}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.rangeSep}>–</Text>
          <View style={styles.rangeField}>
            <Text style={styles.rangeLabel}>{Strings.listRangeTo}</Text>
            <TouchableOpacity style={styles.rangeBtn} onPress={() => setShowToPicker(true)} activeOpacity={0.7}>
              <Text style={styles.rangeBtnText}>{formatDate(listTo)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={styles.filterLabel}>{Strings.listFilterType}</Text>
          <View style={styles.chipsRow}>
            {SESSION_TYPES.map((type) => (
              <FilterChip
                key={type}
                label={type}
                active={listFilters.sessionTypes.includes(type)}
                onPress={() => toggleType(type)}
              />
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: Spacing.sm }]}>{Strings.listFilterModality}</Text>
          <View style={styles.chipsRow}>
            {MODALITIES.map(({ label, value }) => (
              <FilterChip
                key={value}
                label={label}
                active={listFilters.modalities.includes(value)}
                onPress={() => toggleModality(value)}
              />
            ))}
          </View>
        </View>

        {/* Content */}
        {isLoadingRange ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : subtab === 'metrics' ? (
          <MetricsView sessions={filtered} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{Strings.listEmpty}</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filtered.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onDelete={() => confirmDelete(session)}
              />
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Date pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={listFrom}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFromChange}
        />
      )}
      {showFromPicker && Platform.OS === 'ios' && (
        <View style={styles.iosDoneBar}>
          <TouchableOpacity onPress={() => setShowFromPicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {showToPicker && (
        <DateTimePicker
          value={listTo}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleToChange}
        />
      )}
      {showToPicker && Platform.OS === 'ios' && (
        <View style={styles.iosDoneBar}>
          <TouchableOpacity onPress={() => setShowToPicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  subtabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  subtab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  subtabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  subtabText:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  subtabTextActive: { color: Colors.textPrimary },

  rangeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md,
  },
  rangeField: { flex: 1, gap: 4 },
  rangeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 1 },
  rangeBtn: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  rangeBtnText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  rangeSep: { fontSize: FontSize.lg, color: Colors.textMuted, marginTop: 18 },

  filtersSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  filterLabel: {
    fontSize: FontSize.xs, fontWeight: '600',
    color: Colors.textSecondary, letterSpacing: 1, marginBottom: Spacing.xs,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    backgroundColor: Colors.surface,
  },
  chipActive:     { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  chipText:       { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },

  loadingRow: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyRow:   { paddingVertical: Spacing.xl, alignItems: 'center', paddingHorizontal: Spacing.lg },
  emptyText:  { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  listContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  sessionDatecol: { alignItems: 'center', minWidth: 52, gap: 2 },
  sessionDateText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  sessionTimeText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  sessionDuration: { fontSize: FontSize.xs, color: Colors.textMuted },
  sessionInfo: { flex: 1, gap: 4 },
  sessionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  modalityBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  modalityText:  { fontSize: FontSize.xs, fontWeight: '600' },
  sessionAthlete: { fontSize: FontSize.xs, color: Colors.textSecondary },
  deleteBtn:     { padding: Spacing.xs },
  deleteBtnText: { fontSize: 16 },

  metricsContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  metricsSection:   { gap: Spacing.sm },
  metricsSectionLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    fontWeight: '600', letterSpacing: 1.5,
  },
  metricsRow: { flexDirection: 'row', gap: Spacing.md },
  metricCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  metricCardGreen: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  metricCardBlue:  { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' },
  metricValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typeLabel: { fontSize: FontSize.sm, color: Colors.textPrimary, width: 100 },
  typeBarWrap: {
    flex: 1, height: 8, backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  typeBar: { height: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  typeCount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, minWidth: 20, textAlign: 'right' },

  iosDoneBar: {
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.sm, alignItems: 'flex-end', paddingRight: Spacing.lg,
  },
  iosDoneBtn:  { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iosDoneText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
