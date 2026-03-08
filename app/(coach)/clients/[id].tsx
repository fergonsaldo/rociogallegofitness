import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';

interface Routine { id: string; name: string; assigned_at: string; }
interface Session { id: string; started_at: string; finished_at: string | null; status: string; }

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuthStore();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const [routinesRes, sessionsRes] = await Promise.all([
        supabase
          .from('routine_assignments')
          .select('assigned_at, routines ( id, name )')
          .eq('athlete_id', id)
          .order('assigned_at', { ascending: false }),
        supabase
          .from('workout_sessions')
          .select('id, started_at, finished_at, status')
          .eq('athlete_id', id)
          .order('started_at', { ascending: false })
          .limit(10),
      ]);

      setRoutines((routinesRes.data ?? []).map((r: any) => ({
        id: r.routines.id, name: r.routines.name, assigned_at: r.assigned_at,
      })));
      setSessions(sessionsRes.data ?? []);
    } catch (err) {
      console.error('[ClientDetail] fetchClientData:', err);
    } finally {
      setLoading(false);
    }
  };

  const unassignRoutine = (routine: Routine) => {
    Alert.alert('Unassign Routine', `Remove "${routine.name}" from ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('routine_assignments').delete()
          .eq('routine_id', routine.id).eq('athlete_id', id);
        if (!error) setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
      }},
    ]);
  };

  const getInitials = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress';
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return `${mins} min`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => router.push({ pathname: '/(coach)/routines', params: { assignTo: id, assignName: name } })}
        >
          <Text style={styles.assignBtnText}>Assign Routine</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile header */}
          <View style={styles.profileCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{getInitials(name ?? '')}</Text>
            </View>
            <Text style={styles.clientName}>{name}</Text>
            <View style={styles.statsRow}>
              <StatPill label="Routines" value={String(routines.length)} />
              <StatPill label="Sessions" value={String(sessions.length)} />
              <StatPill
                label="Last workout"
                value={sessions[0]
                  ? new Date(sessions[0].started_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                  : '—'}
              />
            </View>
          </View>

          {/* Routines */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ASSIGNED ROUTINES</Text>
            {routines.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No routines assigned yet</Text>
              </View>
            ) : routines.map((r) => (
              <TouchableOpacity
                key={r.id} style={styles.routineCard}
                onLongPress={() => unassignRoutine(r)}
              >
                <View style={styles.routineAccent} />
                <View style={styles.routineContent}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  <Text style={styles.routineDate}>
                    Assigned {new Date(r.assigned_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.longPressHint}>hold to remove</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent sessions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
            {sessions.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No sessions yet</Text>
              </View>
            ) : sessions.map((s) => (
              <View key={s.id} style={styles.sessionCard}>
                <View style={[
                  styles.sessionDot,
                  s.status === 'completed' ? styles.sessionDotDone :
                  s.status === 'abandoned' ? styles.sessionDotAbandoned :
                  styles.sessionDotActive,
                ]} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDate}>
                    {new Date(s.started_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatDuration(s.started_at, s.finished_at)} · {s.status}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  assignBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  assignBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
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
