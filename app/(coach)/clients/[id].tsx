import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { CoachRemoteRepository } from '../../../src/infrastructure/supabase/remote/CoachRemoteRepository';
import {
  getAthleteDetailUseCase,
  unassignRoutineFromAthleteUseCase,
  AthleteDetail,
} from '../../../src/application/coach/ClientUseCases';
import { AthleteRoutineAssignment, AthleteSession } from '../../../src/domain/repositories/ICoachRepository';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { useMessageStore } from '../../../src/presentation/stores/messageStore';

const repo = new CoachRemoteRepository();

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuthStore();
  const { getOrOpenConversation } = useMessageStore();

  const [detail, setDetail] = useState<AthleteDetail>({ assignments: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) loadAthleteDetail();
    }, [id]),
  );

  const loadAthleteDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAthleteDetailUseCase(id, repo);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : Strings.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignRoutine = (assignment: AthleteRoutineAssignment) => {
    Alert.alert(
      Strings.alertUnassignRoutineTitle,
      Strings.alertUnassignRoutineMessage(assignment.routineName, name),
      [
        { text: Strings.alertUnassignCancel, style: 'cancel' },
        {
          text: Strings.alertUnassignConfirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await unassignRoutineFromAthleteUseCase(assignment.routineId, id, repo);
              setDetail((prev) => ({
                ...prev,
                assignments: prev.assignments.filter((a) => a.routineId !== assignment.routineId),
              }));
            } catch (err) {
              setError(err instanceof Error ? err.message : Strings.errorGeneric);
            }
          },
        },
      ],
    );
  };

  const handleOpenChat = async () => {
    if (!user?.id || !id) return;
    try {
      const conv = await getOrOpenConversation(user.id, id);
      router.push({
        pathname: '/(coach)/messages/[id]',
        params: { id: conv.id, name: name ?? '' },
      });
    } catch {
      Alert.alert('Error', 'No se pudo abrir la conversación');
    }
  };

  const getInitials = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return Strings.labelInProgress;
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${mins} min`;
  };

  const { assignments, sessions } = detail;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.msgBtn} onPress={handleOpenChat}>
            <Text style={styles.msgBtnText}>💬 {Strings.buttonMessage}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={() => router.push({ pathname: '/(coach)/routines', params: { assignTo: id, assignName: name } })}
          >
            <Text style={styles.assignBtnText}>Asignar rutina</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{getInitials(name ?? '')}</Text>
            </View>
            <Text style={styles.clientName}>{name}</Text>
            <View style={styles.statsRow}>
              <StatPill label={Strings.labelRoutines} value={String(assignments.length)} />
              <StatPill label={Strings.labelSessions} value={String(sessions.length)} />
              <StatPill
                label={Strings.labelLastWorkout}
                value={sessions[0]
                  ? sessions[0].startedAt.toLocaleDateString('es', { month: 'short', day: 'numeric' })
                  : '—'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RUTINAS ASIGNADAS</Text>
            {assignments.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Sin rutinas asignadas aún</Text>
              </View>
            ) : assignments.map((a) => (
              <TouchableOpacity
                key={a.routineId}
                style={styles.routineCard}
                onLongPress={() => handleUnassignRoutine(a)}
              >
                <View style={styles.routineAccent} />
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>{a.routineName}</Text>
                  <Text style={styles.routineDate}>
                    {Strings.labelAssigned(a.assignedAt.toLocaleDateString('es', { month: 'short', day: 'numeric', year: 'numeric' }))}
                  </Text>
                </View>
                <Text style={styles.longPressHint}>mantén para quitar</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SESIONES RECIENTES</Text>
            {sessions.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>Sin sesiones aún</Text>
              </View>
            ) : sessions.map((s) => (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[
                  styles.sessionDot,
                  s.status === 'completed'  ? styles.sessionDotDone :
                  s.status === 'abandoned'  ? styles.sessionDotAbandoned :
                  styles.sessionDotActive,
                ]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {s.startedAt.toLocaleDateString('es', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatDuration(s.startedAt, s.finishedAt)} · {s.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  topbarActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  msgBtn: { backgroundColor: Colors.athleteSubtle, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border },
  msgBtnText: { color: Colors.athlete, fontSize: 13, fontWeight: '600' },
  assignBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  assignBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  errorText: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center' },
  profileCard: { backgroundColor: Colors.surface, margin: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  clientName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statPill: { backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg, gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  emptySection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  emptySectionText: { color: Colors.textMuted, fontSize: FontSize.sm },
  routineCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  routineAccent: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.primary },
  routineContent: { flex: 1, padding: Spacing.md, gap: 2 },
  routineName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  routineDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  longPressHint: { fontSize: 9, color: Colors.textMuted, paddingRight: Spacing.sm },
  sessionCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionDotDone: { backgroundColor: Colors.success },
  sessionDotAbandoned: { backgroundColor: Colors.error },
  sessionDotActive: { backgroundColor: Colors.athlete },
  sessionInfo: { flex: 1 },
  sessionDate: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  sessionMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
