import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useCoachCalendarStore } from '../../../src/presentation/stores/coachCalendarStore';
import { CoachSession } from '../../../src/domain/entities/CoachSession';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS  = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  const offset   = (firstDay.getDay() + 6) % 7; // Mon = 0
  const days: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessions, isLoading, fetchMonth, removeSession, setSelectedDate, selectedDate } =
    useCoachCalendarStore();

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  useEffect(() => {
    if (user?.id) fetchMonth(user.id, year, month);
  }, [user?.id, year, month]);

  const calendarDays = buildCalendarDays(year, month);

  const sessionDaySet = new Set(sessions.map((s) => s.scheduledAt.getDate()));

  const isCurrentMonth =
    selectedDate.getFullYear() === year && selectedDate.getMonth() + 1 === month;
  const selectedDay = isCurrentMonth ? selectedDate.getDate() : null;

  const daySessionsMap = new Map<number, CoachSession[]>();
  for (const s of sessions) {
    const d = s.scheduledAt.getDate();
    const list = daySessionsMap.get(d) ?? [];
    list.push(s);
    daySessionsMap.set(d, list);
  }

  const selectedSessions = selectedDay ? (daySessionsMap.get(selectedDay) ?? []) : [];

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  function selectDay(day: number) {
    setSelectedDate(new Date(year, month - 1, day));
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

  function navigateToCreate() {
    const date = selectedDay
      ? new Date(year, month - 1, selectedDay)
      : new Date();
    router.push({
      pathname: '/(coach)/calendar/create',
      params: { date: date.toISOString() },
    } as any);
  }

  const selectedDateLabel = selectedDay
    ? new Date(year, month - 1, selectedDay)
        .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        .toUpperCase()
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{Strings.calendarTitle}</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={navigateToCreate}>
          <Text style={styles.newBtnText}>{Strings.calendarNewSession}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {DAY_LABELS.map((label) => (
            <Text key={label} style={styles.dayHeaderText}>{label}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.grid}>
            {calendarDays.map((day, idx) => {
              const isToday =
                day !== null &&
                day === today.getDate() &&
                month === today.getMonth() + 1 &&
                year === today.getFullYear();
              const isSelected  = day !== null && day === selectedDay;
              const hasSessions = day !== null && sessionDaySet.has(day);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => day && selectDay(day)}
                  disabled={day === null}
                  activeOpacity={0.7}
                >
                  {day !== null && (
                    <>
                      <Text style={[
                        styles.dayNumber,
                        isSelected && styles.dayNumberSelected,
                        isToday && !isSelected && styles.dayNumberToday,
                      ]}>
                        {day}
                      </Text>
                      {hasSessions && (
                        <View style={[styles.dot, isSelected && styles.dotSelected]} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Session list */}
        <View style={styles.sessionsSection}>
          {selectedDateLabel ? (
            <>
              <Text style={styles.sectionLabel}>{selectedDateLabel}</Text>

              {selectedSessions.length === 0 ? (
                <View style={styles.emptyDay}>
                  <Text style={styles.emptyDayText}>{Strings.calendarNoSessions}</Text>
                </View>
              ) : (
                selectedSessions.map((session) => (
                  <View key={session.id} style={styles.sessionRow}>
                    <View style={styles.sessionTimecol}>
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
                          <Text style={styles.sessionAthlete} numberOfLines={1}>
                            · {session.athleteName}
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmDelete(session)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          ) : (
            <View style={styles.noSelection}>
              <Text style={styles.noSelectionText}>Selecciona un día para ver las sesiones</Text>
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar:  { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title:      { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  newBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  newBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  navBtn:      { padding: Spacing.sm },
  navArrow:    { fontSize: 28, color: Colors.textPrimary, fontWeight: '300', lineHeight: 32 },
  monthLabel:  { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  dayHeaderText: {
    flex: 1, textAlign: 'center',
    fontSize: FontSize.xs, color: Colors.textMuted,
    fontWeight: '600', letterSpacing: 1,
  },

  loadingRow: { paddingVertical: Spacing.xl, alignItems: 'center' },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
  },
  dayCell: {
    width: `${100 / 7}%`, height: CELL_SIZE,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayCellToday:    { backgroundColor: Colors.primarySubtle },
  dayNumber:         { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  dayNumberSelected: { color: '#fff', fontWeight: '700' },
  dayNumberToday:    { color: Colors.primary, fontWeight: '700' },
  dot:         { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 2 },
  dotSelected: { backgroundColor: '#fff' },

  sessionsSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md, gap: Spacing.sm },
  sectionLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    letterSpacing: 1.5, fontWeight: '600', marginBottom: Spacing.xs,
  },
  emptyDay: { paddingVertical: Spacing.lg, alignItems: 'center' },
  emptyDayText: { fontSize: FontSize.sm, color: Colors.textMuted },
  noSelection: { paddingVertical: Spacing.xl, alignItems: 'center' },
  noSelectionText: { fontSize: FontSize.sm, color: Colors.textMuted },

  sessionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  sessionTimecol: { alignItems: 'center', minWidth: 44, gap: 2 },
  sessionTimeText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  sessionDuration: { fontSize: FontSize.xs, color: Colors.textMuted },
  sessionInfo: { flex: 1, gap: 4 },
  sessionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  modalityBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  modalityText: { fontSize: FontSize.xs, fontWeight: '600' },
  sessionAthlete: { fontSize: FontSize.xs, color: Colors.textSecondary },
  deleteBtn: { padding: Spacing.xs },
  deleteBtnText: { fontSize: 16 },
});
