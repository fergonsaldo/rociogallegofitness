import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useScheduleStore } from '../../../src/presentation/stores/scheduleStore';
import { Schedule } from '../../../src/domain/entities/Schedule';
import { calculateTotalSlots } from '../../../src/application/coach/ScheduleUseCases';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── ScheduleCard ──────────────────────────────────────────────────────────────

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
}: {
  schedule: Schedule;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (schedule: Schedule) => void;
}) {
  const totalSlots = calculateTotalSlots(schedule);
  const modality   = schedule.modality === 'in_person'
    ? Strings.schedulesModalityInPerson
    : Strings.schedulesModalityOnline;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{schedule.title}</Text>
        <Switch
          value={schedule.isActive}
          onValueChange={(val) => onToggle(schedule.id, val)}
          trackColor={{ false: Colors.border, true: `${Colors.primary}60` }}
          thumbColor={schedule.isActive ? Colors.primary : Colors.textMuted}
        />
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>📅 {formatDate(schedule.startDate)} → {formatDate(schedule.endDate)}</Text>
        <Text style={styles.metaText}>🕐 {schedule.startTime} – {schedule.endTime} · {schedule.slotDurationMinutes} min/slot</Text>
        <View style={styles.cardFooter}>
          <View style={styles.pillRow}>
            <View style={styles.pill}><Text style={styles.pillText}>{modality}</Text></View>
            <View style={[styles.pill, schedule.isActive ? styles.pillActive : styles.pillInactive]}>
              <Text style={[styles.pillText, schedule.isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                {schedule.isActive ? Strings.schedulesActive : Strings.schedulesInactive}
              </Text>
            </View>
          </View>
          <View style={styles.slotsRow}>
            <Text style={styles.slotsText}>{Strings.schedulesSlots(totalSlots)}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(schedule)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SchedulesScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const { schedules, isLoading, error,
          fetchSchedules, toggleActive,
          deleteSchedule, clearError } = useScheduleStore();

  useFocusEffect(useCallback(() => {
    if (user?.id) fetchSchedules(user.id);
  }, [user?.id]));

  const handleToggle = (id: string, isActive: boolean) => {
    toggleActive(id, isActive);
  };

  const handleDelete = (schedule: Schedule) => {
    Alert.alert(
      Strings.alertDeleteScheduleTitle,
      Strings.alertDeleteScheduleMessage(schedule.title),
      [
        { text: Strings.alertDeleteScheduleCancel, style: 'cancel' },
        {
          text: Strings.alertDeleteScheduleConfirm,
          style: 'destructive',
          onPress: () => deleteSchedule(schedule.id),
        },
      ],
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{Strings.schedulesTitle}</Text>
          <Text style={styles.subtitle}>{Strings.schedulesSubtitle(schedules.length)}</Text>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(coach)/schedules/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.newButtonText}>{Strings.schedulesNewButton}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : schedules.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🗓️</Text>
          <Text style={styles.emptyText}>{Strings.schedulesEmpty}</Text>
          <Text style={styles.emptySubtitle}>{Strings.schedulesEmptySubtitle}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:         { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:      { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  newButton:     { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  newButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  emptyEmoji:    { fontSize: 40 },
  emptyText:     { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  errorText:     { fontSize: FontSize.md, color: Colors.error, textAlign: 'center' },
  retryBtn:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  retryBtnText:  { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  list:          { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, gap: Spacing.md },

  // Card
  card:         { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardTitle:    { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardMeta:     { gap: Spacing.xs },
  metaText:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
  pillRow:      { flexDirection: 'row', gap: Spacing.xs },
  pill:         { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceMuted, borderWidth: 1, borderColor: Colors.border },
  pillActive:   { backgroundColor: `${Colors.primary}15`, borderColor: `${Colors.primary}40` },
  pillInactive: { backgroundColor: Colors.surfaceMuted },
  pillText:         { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
  pillTextActive:   { color: Colors.primary },
  pillTextInactive: { color: Colors.textMuted },
  slotsRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  slotsText:    { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  deleteBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: `${Colors.error}10`, borderWidth: 1, borderColor: `${Colors.error}30`, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:{ fontSize: 13 },
});
