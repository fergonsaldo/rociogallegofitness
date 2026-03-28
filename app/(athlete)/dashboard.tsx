import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { useProgressStore } from '../../src/presentation/stores/progressStore';
import { useRoutineStore } from '../../src/presentation/stores/routineStore';
import { findExerciseById } from '../../src/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/shared/constants/theme';
import { Strings } from '../../src/shared/constants/strings';

export default function AthleteDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { history, historyLoading, personalBests, fetchHistory, fetchPersonalBests } = useProgressStore();
  const { routines, fetchAthleteRoutines } = useRoutineStore();

  useEffect(() => {
    if (!user?.id) return;
    fetchHistory(user.id);
    fetchPersonalBests(user.id);
    fetchAthleteRoutines(user.id);
  }, [user?.id]);

  const lastSession = history[0] ?? null;
  const totalWorkouts = history.length;
  const streak = computeStreak(history.map((h) => h.session.startedAt));

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weeklyVolume = history
    .filter((h) => h.session.startedAt >= weekStart)
    .reduce((sum, h) => sum + h.totalVolumeKg, 0);

  const topBests = personalBests.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}, {user?.name?.split(' ')[0] ?? Strings.fallbackAthlete} 👋
            </Text>
            <Text style={styles.subGreeting}>¿Listo para el entrenamiento de hoy?</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <QuickStat emoji="🔥" value={String(streak)} label={Strings.labelDayStreak} accent={Colors.primary} />
          <QuickStat emoji="🏋️" value={String(totalWorkouts)} label={Strings.labelWorkouts} accent={Colors.athlete} />
          <QuickStat
            emoji="⚡️"
            value={weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000 * 10) / 10}k` : '—'}
            label={Strings.labelThisWeek}
            accent={Colors.success}
          />
        </View>

        {/* Start workout CTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Iniciar entrenamiento</Text>
          {routines.length === 0 ? (
            <View style={styles.noRoutinesBanner}>
              <Text style={styles.noRoutinesEmoji}>📋</Text>
              <Text style={styles.noRoutinesText}>Tu entrenador aún no te ha asignado una rutina</Text>
            </View>
          ) : (
            routines.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                style={styles.routineCTA}
                onPress={() => router.push({
                  pathname: '/(athlete)/workout/session',
                  params: { routineDayId: routine.days[0]?.id },
                })}
                activeOpacity={0.8}
              >
                <View style={styles.routineCTALeft}>
                  <Text style={styles.routineCTAName}>{routine.name}</Text>
                  <Text style={styles.routineCTAMeta}>
                    {routine.days.length} days · {routine.days[0]?.name ?? 'Day 1'}
                  </Text>
                </View>
                <View style={styles.startBadge}>
                  <Text style={styles.startBadgeText}>▶</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Last workout */}
        {historyLoading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={Colors.athlete} /></View>
        ) : lastSession && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Último entrenamiento</Text>
            <TouchableOpacity
              style={styles.lastSessionCard}
              onPress={() => router.push({
                pathname: '/(athlete)/progress/session',
                params: { sessionId: lastSession.session.id },
              })}
              activeOpacity={0.7}
            >
              <View style={styles.lastSessionHeader}>
                <Text style={styles.lastSessionDate}>
                  {lastSession.session.startedAt.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.lastSessionDuration}>⏱ {lastSession.durationMinutes}m</Text>
              </View>
              <View style={styles.lastSessionStats}>
                <MiniStat value={String(lastSession.totalSets)} label={Strings.labelSets} />
                <MiniStat value={String(lastSession.exerciseCount)} label={Strings.labelExercises} />
                <MiniStat value={`${Math.round(lastSession.totalVolumeKg)} kg`} label={Strings.labelVolume} />
              </View>
              <Text style={styles.viewDetail}>Ver detalles →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Personal bests */}
        {topBests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Récords personales</Text>
              <TouchableOpacity onPress={() => router.push('/(athlete)/progress')}>
                <Text style={styles.seeAll}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {topBests.map((pb) => {
              const exercise = findExerciseById(pb.exerciseId);
              return (
                <TouchableOpacity
                  key={pb.exerciseId}
                  style={styles.pbRow}
                  onPress={() => router.push({
                    pathname: '/(athlete)/progress/exercise',
                    params: { exerciseId: pb.exerciseId },
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pbName}>{exercise?.name ?? Strings.fallbackUnknown}</Text>
                  {pb.estimatedOneRepMaxKg && (
                    <View style={styles.pbBadge}>
                      <Text style={styles.pbBadgeText}>{pb.estimatedOneRepMaxKg} kg</Text>
                    </View>
                  )}
                  <Text style={styles.pbChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Accesos rápidos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos</Text>
          <TouchableOpacity
            style={styles.resourceRow}
            onPress={() => router.push('/(athlete)/documents' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceEmoji}>📁</Text>
            <View style={styles.resourceText}>
              <Text style={styles.resourceTitle}>{Strings.docTitle}</Text>
              <Text style={styles.resourceSubtitle}>{Strings.docAthleteSubtitle}</Text>
            </View>
            <Text style={styles.resourceChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return Strings.greetingMorning;
  if (h < 18) return Strings.greetingAfternoon;
  return Strings.greetingEvening;
}

function computeStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const days = [...new Set(dates.map((d) => d.toDateString()))].sort().reverse();
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (days[i] === expected.toDateString()) { streak++; } else break;
  }
  return streak;
}

function QuickStat({ emoji, value, label, accent }: { emoji: string; value: string; label: string; accent: string }) {
  return (
    <View style={[styles.quickStat, { borderTopColor: accent, borderTopWidth: 3 }]}>
      <Text style={styles.quickStatEmoji}>{emoji}</Text>
      <Text style={[styles.quickStatValue, { color: accent }]}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: Spacing.lg, paddingBottom: 0,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subGreeting: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  logoutBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  logoutText: { fontSize: FontSize.xs, color: Colors.textMuted },
  statsRow: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
  quickStat: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 3,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickStatEmoji: { fontSize: 20 },
  quickStatValue: { fontSize: FontSize.xl, fontWeight: '800' },
  quickStatLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 0.5 },
  section: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: FontSize.xs, color: Colors.athlete, fontWeight: '600' },
  routineCTA: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  routineCTALeft: { flex: 1 },
  routineCTAName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  routineCTAMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  startBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.athlete, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  startBadgeText: { color: '#fff', fontSize: FontSize.md },
  noRoutinesBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  noRoutinesEmoji: { fontSize: 24 },
  noRoutinesText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  loadingBox: { padding: Spacing.xl, alignItems: 'center' },
  lastSessionCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  lastSessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastSessionDate: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  lastSessionDuration: { fontSize: FontSize.xs, color: Colors.textSecondary },
  lastSessionStats: { flexDirection: 'row', gap: Spacing.xl },
  miniStat: { gap: 2 },
  miniStatValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  miniStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  viewDetail: { fontSize: FontSize.xs, color: Colors.athlete, fontWeight: '600' },
  pbRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.sm,
  },
  pbName: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  pbBadge: {
    backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.primary}25`,
  },
  pbBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  pbChevron: { fontSize: 20, color: Colors.textMuted },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  resourceEmoji:    { fontSize: 24 },
  resourceText:     { flex: 1 },
  resourceTitle:    { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  resourceSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  resourceChevron:  { fontSize: 20, color: Colors.textMuted },
});
