import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/presentation/stores/authStore';
import { useCoachDashboardStore } from '../../src/presentation/stores/coachDashboardStore';
import { useCoachCalendarStore } from '../../src/presentation/stores/coachCalendarStore';
import { useCoachPreferencesStore } from '../../src/presentation/stores/coachPreferencesStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/shared/constants/theme';
import {
  ActivityStatusFilter,
  filterActivityByStatus,
} from '../../src/application/coach/ClientUseCases';
import {
  QUICK_ACCESS_CATALOG,
  getActiveShortcuts,
} from '../../src/shared/constants/quickAccessCatalog';
import { Strings } from '../../src/shared/constants/strings';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WidgetClientes({
  total,
  activeThisWeek,
  onPress,
}: {
  total: number;
  activeThisWeek: number;
  onPress: () => void;
}) {
  if (total === 0) {
    return (
      <TouchableOpacity style={styles.widgetEmpty} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.widgetEmptyEmoji}>👥</Text>
        <Text style={styles.widgetEmptyTitle}>Sin clientes todavía</Text>
        <Text style={styles.widgetEmptySubtitle}>Añade tu primer atleta para empezar</Text>
        <View style={styles.widgetEmptyCTA}>
          <Text style={styles.widgetEmptyCTAText}>Ir a Clientes →</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.widget} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetLabel}>MIS CLIENTES</Text>
        <Text style={styles.widgetArrow}>→</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{activeThisWeek}</Text>
          <Text style={styles.statLabel}>Activos esta semana</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ACTIVITY_FILTERS: { key: ActivityStatusFilter; label: string }[] = [
  { key: 'all',         label: Strings.activityFilterAll },
  { key: 'completed',   label: Strings.activityFilterCompleted },
  { key: 'in_progress', label: Strings.activityFilterInProgress },
];

function ActividadReciente({
  sessions,
  onAthletePress,
}: {
  sessions: Array<{
    sessionId: string;
    athleteId: string;
    athleteName: string;
    startedAt: Date;
    status: string;
  }>;
  onAthletePress: (athleteId: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<ActivityStatusFilter>('all');
  const filtered = filterActivityByStatus(sessions as any, activeFilter);

  return (
    <View style={styles.widget}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetLabel}>ACTIVIDAD RECIENTE</Text>
      </View>

      {/* Chips de filtro */}
      <View style={styles.filterRow}>
        {ACTIVITY_FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, activeFilter === key && styles.filterChipActive]}
            onPress={() => setActiveFilter(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeFilter === key && styles.filterChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.activityEmpty}>
          <Text style={styles.activityEmptyText}>Ningún atleta ha entrenado todavía</Text>
        </View>
      ) : (
        filtered.map((s) => (
          <TouchableOpacity
            key={s.sessionId}
            style={styles.activityRow}
            onPress={() => onAthletePress(s.athleteId)}
            activeOpacity={0.7}
          >
            <View style={styles.activityAvatar}>
              <Text style={styles.activityAvatarText}>
                {(s.athleteName[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName} numberOfLines={1}>{s.athleteName}</Text>
              <Text style={styles.activityDate}>{formatRelativeDate(s.startedAt)}</Text>
            </View>
            <View style={[
              styles.activityBadge,
              {
                backgroundColor:
                  s.status === 'completed' ? Colors.success + '18' : Colors.warning + '18',
              },
            ]}>
              <Text style={[
                styles.activityBadgeText,
                { color: s.status === 'completed' ? Colors.success : Colors.warning },
              ]}>
                {s.status === 'completed' ? Strings.activityFilterCompleted : Strings.activityFilterInProgress}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ── Agenda widget ─────────────────────────────────────────────────────────────

function WidgetAgenda({ onPress }: { onPress: () => void }) {
  const { sessions, fetchMonth } = useCoachCalendarStore();
  const { user } = useAuthStore();

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    if (user?.id) fetchMonth(user.id, year, month);
  }, [user?.id]);

  const todaySessions = sessions.filter((s) => {
    const d = s.scheduledAt;
    return d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  });

  const nextSessions = sessions
    .filter((s) => s.scheduledAt > now)
    .slice(0, 3);

  const displayed = todaySessions.length > 0 ? todaySessions.slice(0, 3) : nextSessions;

  return (
    <TouchableOpacity style={styles.widget} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetLabel}>{Strings.calendarWidgetTitle.toUpperCase()}</Text>
        <Text style={styles.widgetArrow}>→</Text>
      </View>
      {displayed.length === 0 ? (
        <View style={styles.activityEmpty}>
          <Text style={styles.activityEmptyText}>{Strings.calendarWidgetEmpty}</Text>
        </View>
      ) : (
        displayed.map((s) => {
          const timeStr = s.scheduledAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          return (
            <View key={s.id} style={styles.agendaRow}>
              <View style={[
                styles.agendaDot,
                { backgroundColor: s.modality === 'online' ? '#0369A1' : Colors.success },
              ]} />
              <Text style={styles.agendaTime}>{timeStr}</Text>
              <Text style={styles.agendaTitle} numberOfLines={1}>
                {s.title ?? s.sessionType}
              </Text>
              {s.athleteName && (
                <Text style={styles.agendaAthlete} numberOfLines={1}>· {s.athleteName}</Text>
              )}
            </View>
          );
        })
      )}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { summary, isLoading, fetchDashboardSummary } = useCoachDashboardStore();
  const { quickAccess, isSaving, loadQuickAccess, saveQuickAccess } = useCoachPreferencesStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftSelection,   setDraftSelection]   = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardSummary(user.id);
      loadQuickAccess(user.id);
    }
  }, [user?.id]);

  function openEditModal() {
    setDraftSelection([...quickAccess]);
    setEditModalVisible(true);
  }

  function toggleDraft(key: string) {
    setDraftSelection((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleSave() {
    if (draftSelection.length === 0) {
      Alert.alert('', Strings.quickAccessMinOneError);
      return;
    }
    if (user?.id) await saveQuickAccess(user.id, draftSelection);
    setEditModalVisible(false);
  }

  const activeShortcuts = getActiveShortcuts(quickAccess);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.greeting}>Bienvenido 👋</Text>
              <Text style={styles.name}>{user?.fullName ?? 'Coach'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Widgets de actividad */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.section}>
            <WidgetClientes
              total={summary?.totalAthletes ?? 0}
              activeThisWeek={summary?.activeAthletesThisWeek ?? 0}
              onPress={() => router.push('/(coach)/clients')}
            />
            <WidgetAgenda onPress={() => router.push('/(coach)/calendar' as any)} />
            <ActividadReciente
              sessions={summary?.recentSessions ?? []}
              onAthletePress={(athleteId) =>
                router.push({ pathname: '/(coach)/clients/[id]', params: { id: athleteId } })
              }
            />
          </View>
        )}

        {/* Accesos directos */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{Strings.quickAccessTitle}</Text>
            <TouchableOpacity onPress={openEditModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.sectionEditBtn}>{Strings.quickAccessEditButton}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {activeShortcuts.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.accionCard, { borderColor: item.color + '30' }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.accionIcon, { backgroundColor: item.subtle }]}>
                  <Text style={styles.accionEmoji}>{item.emoji}</Text>
                </View>
                <Text style={[styles.accionTitulo, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modal de edición de accesos rápidos */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancel}>{Strings.quickAccessCancelButton}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{Strings.quickAccessModalTitle}</Text>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                <Text style={[styles.modalSave, isSaving && styles.modalSaveDisabled]}>
                  {Strings.quickAccessSaveButton}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{Strings.quickAccessModalSubtitle}</Text>
            <View style={styles.catalogGrid}>
              {QUICK_ACCESS_CATALOG.map((item) => {
                const selected = draftSelection.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.catalogItem, selected && { borderColor: item.color, borderWidth: 2 }]}
                    onPress={() => toggleDraft(item.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catalogIcon, { backgroundColor: item.subtle }]}>
                      <Text style={styles.catalogEmoji}>{item.emoji}</Text>
                    </View>
                    <Text style={[styles.catalogLabel, selected && { color: item.color, fontWeight: '700' }]}>
                      {item.label}
                    </Text>
                    {selected && <Text style={[styles.catalogCheck, { color: item.color }]}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar:   { width: 4, height: 40, backgroundColor: Colors.primary, borderRadius: 2 },
  greeting:    { fontSize: FontSize.sm, color: Colors.textSecondary },
  name:        { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  logoutBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  logoutText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  loadingContainer: { paddingVertical: Spacing.xl, alignItems: 'center' },

  section:      { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    letterSpacing: 2, fontWeight: '600',
  },

  // ── Widgets ───────────────────────────────────────────────────────────────
  widget: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  widgetLabel: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    letterSpacing: 1.5, fontWeight: '600',
  },
  widgetArrow: { fontSize: FontSize.sm, color: Colors.textMuted },

  widgetEmpty: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  widgetEmptyEmoji:    { fontSize: 32 },
  widgetEmptyTitle:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  widgetEmptySubtitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center',
  },
  widgetEmptyCTA: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primarySubtle,
    borderRadius: BorderRadius.md,
  },
  widgetEmptyCTAText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },

  // ── Widget Clientes ───────────────────────────────────────────────────────
  statsRow:    { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.xs },
  statCell:    { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  statValue:   { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  statLabel:   { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },

  // ── Actividad reciente ────────────────────────────────────────────────────
  filterRow: { flexDirection: 'row', gap: Spacing.xs },
  filterChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  filterChipText:       { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },

  activityEmpty:     { paddingVertical: Spacing.md, alignItems: 'center' },
  activityEmptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  activityAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center', justifyContent: 'center',
  },
  activityAvatarText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  activityInfo:       { flex: 1, gap: 2 },
  activityName:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  activityDate:       { fontSize: FontSize.xs, color: Colors.textMuted },
  activityBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  activityBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },

  // ── Widget Agenda ─────────────────────────────────────────────────────────
  agendaRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  agendaDot:     { width: 8, height: 8, borderRadius: 4 },
  agendaTime:    { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', minWidth: 36 },
  agendaTitle:   { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  agendaAthlete: { fontSize: FontSize.xs, color: Colors.textMuted },

  // ── Acciones rápidas ──────────────────────────────────────────────────────
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEditBtn:   { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  accionCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  accionIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  accionEmoji:  { fontSize: 24 },
  accionTitulo: { fontSize: FontSize.md, fontWeight: '800' },

  // ── Modal de edición ──────────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: Colors.background, paddingTop: Spacing.lg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle:        { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  modalCancel:       { fontSize: FontSize.md, color: Colors.textSecondary },
  modalSave:         { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  modalSaveDisabled: { opacity: 0.4 },
  modalSubtitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  catalogGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  catalogItem: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.xs, alignItems: 'center',
  },
  catalogIcon:  { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  catalogEmoji: { fontSize: 26 },
  catalogLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  catalogCheck: { fontSize: FontSize.md, fontWeight: '700', position: 'absolute', top: 8, right: 10 },
});
