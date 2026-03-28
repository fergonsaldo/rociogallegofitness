import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { useCallback, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useSessionActivityStore } from '../../../src/presentation/stores/sessionActivityStore';
import { useCoachCalendarStore } from '../../../src/presentation/stores/coachCalendarStore';
import { SessionActivityLog } from '../../../src/domain/entities/SessionActivityLog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatLoggedAt(date: Date): string {
  return date.toLocaleString('es-ES', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── ActivityLogRow ─────────────────────────────────────────────────────────────

function ActivityLogRow({
  log,
  onNavigate,
}: {
  log:        SessionActivityLog;
  onNavigate: (log: SessionActivityLog) => void;
}) {
  const isDeleted = log.action === 'deleted';
  const canNavigate = log.sessionId !== null && !isDeleted;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => canNavigate && onNavigate(log)}
      activeOpacity={canNavigate ? 0.7 : 1}
      disabled={!canNavigate}
    >
      <View style={[styles.actionBadge, isDeleted ? styles.actionBadgeDeleted : styles.actionBadgeCreated]}>
        <Text style={[styles.actionBadgeText, isDeleted ? styles.actionBadgeTextDeleted : styles.actionBadgeTextCreated]}>
          {isDeleted ? Strings.activityLogActionDeleted : Strings.activityLogActionCreated}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowTitle, isDeleted && styles.rowTitleDeleted]} numberOfLines={1}>
            {log.title ?? log.sessionType ?? '—'}
          </Text>
          {isDeleted && (
            <View style={styles.deletedBadge}>
              <Text style={styles.deletedBadgeText}>{Strings.activityLogDeletedBadge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowMeta}>
          {log.sessionType}{log.modality ? ` · ${log.modality === 'in_person' ? 'Presencial' : 'Online'}` : ''}
        </Text>
        {log.scheduledAt && (
          <Text style={styles.rowScheduled}>📅 {formatDate(log.scheduledAt)}</Text>
        )}
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowTime}>{formatLoggedAt(log.loggedAt)}</Text>
        {canNavigate && <Text style={styles.navHint}>{Strings.activityLogNavigateHint} ›</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SessionActivityScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { logs, from, to, isLoading, error,
          fetchLogs, setFrom, setTo, clearError } = useSessionActivityStore();
  const { setSelectedDate } = useCoachCalendarStore();

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);

  useFocusEffect(useCallback(() => {
    if (user?.id) fetchLogs(user.id);
  }, [user?.id]));

  useEffect(() => {
    if (user?.id) fetchLogs(user.id);
  }, [from, to]);

  const handleNavigate = (log: SessionActivityLog) => {
    if (log.scheduledAt) {
      setSelectedDate(log.scheduledAt);
    }
    router.push('/(coach)/calendar');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.activityLogTitle}</Text>
          <Text style={styles.subtitle}>{Strings.activityLogSubtitle(logs.length)}</Text>
        </View>
      </View>

      {/* Range selector */}
      <View style={styles.rangeRow}>
        <View style={styles.rangeField}>
          <Text style={styles.rangeLabel}>Desde</Text>
          <TouchableOpacity style={styles.rangeBtn} onPress={() => setShowFromPicker(true)} activeOpacity={0.7}>
            <Text style={styles.rangeBtnText}>{formatDate(from)}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rangeSep}>–</Text>
        <View style={styles.rangeField}>
          <Text style={styles.rangeLabel}>Hasta</Text>
          <TouchableOpacity style={styles.rangeBtn} onPress={() => setShowToPicker(true)} activeOpacity={0.7}>
            <Text style={styles.rangeBtnText}>{formatDate(to)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>{Strings.activityLogEmpty}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {logs.map((log) => (
            <ActivityLogRow key={log.id} log={log} onNavigate={handleNavigate} />
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}

      {/* From picker */}
      {showFromPicker && (
        <DateTimePicker
          value={from}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowFromPicker(false);
            if (date) setFrom(date);
          }}
        />
      )}
      {showFromPicker && Platform.OS === 'ios' && (
        <View style={styles.iosBar}>
          <TouchableOpacity onPress={() => setShowFromPicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* To picker */}
      {showToPicker && (
        <DateTimePicker
          value={to}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS === 'android') setShowToPicker(false);
            if (date) setTo(date);
          }}
        />
      )}
      {showToPicker && Platform.OS === 'ios' && (
        <View style={styles.iosBar}>
          <TouchableOpacity onPress={() => setShowToPicker(false)} style={styles.iosDoneBtn}>
            <Text style={styles.iosDoneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.background },
  header:   { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  title:    { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  rangeRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  rangeField:   { flex: 1, gap: 4 },
  rangeLabel:   { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 1 },
  rangeBtn:     { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  rangeBtnText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  rangeSep:     { fontSize: FontSize.lg, color: Colors.textMuted, marginTop: 18 },

  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:   { fontSize: 40 },
  emptyText:    { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
  errorText:    { fontSize: FontSize.md, color: Colors.error, textAlign: 'center' },
  retryBtn:     { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  retryBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.sm },

  row:            { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, gap: Spacing.sm },
  actionBadge:    { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 2 },
  actionBadgeCreated: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  actionBadgeDeleted: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  actionBadgeText:         { fontSize: FontSize.xs, fontWeight: '700' },
  actionBadgeTextCreated:  { color: '#166534' },
  actionBadgeTextDeleted:  { color: '#991B1B' },

  rowInfo:        { flex: 1, gap: 2 },
  rowTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  rowTitle:       { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  rowTitleDeleted:{ color: Colors.textMuted },
  deletedBadge:   { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  deletedBadgeText:{ fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  rowMeta:        { fontSize: FontSize.xs, color: Colors.textSecondary },
  rowScheduled:   { fontSize: FontSize.xs, color: Colors.textMuted },

  rowRight:  { alignItems: 'flex-end', gap: 4, minWidth: 80 },
  rowTime:   { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  navHint:   { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  iosBar:     { backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.sm, alignItems: 'flex-end', paddingRight: Spacing.lg },
  iosDoneBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  iosDoneText:{ color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
});
