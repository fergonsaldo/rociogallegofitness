import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
  Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { CoachRemoteRepository } from '../../../src/infrastructure/supabase/remote/CoachRemoteRepository';
import { TagRemoteRepository } from '../../../src/infrastructure/supabase/remote/TagRemoteRepository';
import {
  archiveAthleteUseCase,
  restoreAthleteUseCase,
} from '../../../src/application/coach/ClientUseCases';
import { ClientStatus } from '../../../src/domain/repositories/ICoachRepository';
import { ClientTag } from '../../../src/domain/entities/ClientTag';
import { TagPickerModal } from '../../../src/presentation/components/coach/TagPickerModal';
import { useTagStore } from '../../../src/presentation/stores/tagStore';

// ── Pure helpers ──────────────────────────────────────────────────────────────

export interface Athlete {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  assigned_at: string;
  status: ClientStatus;
  lastSessionAt: Date | null;
  routineCount: number;
  tags: ClientTag[];
}

export function formatLastActivity(date: Date | null): string {
  if (!date) return Strings.clientsLastActivityNever;
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return Strings.clientsLastActivityToday;
  if (diffDays === 1) return Strings.clientsLastActivityYesterday;
  if (diffDays < 7)  return Strings.clientsLastActivityDaysAgo(diffDays);
  if (diffDays < 30) return Strings.clientsLastActivityWeeksAgo(Math.floor(diffDays / 7));
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function filterAthletes(
  athletes: Athlete[],
  tab: ClientStatus,
  query: string,
): Athlete[] {
  const q = query.trim().toLowerCase();
  return athletes.filter((a) => {
    if (a.status !== tab) return false;
    if (!q) return true;
    return (
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalMode = 'create';

const TABS: { key: ClientStatus; label: string }[] = [
  { key: 'active',   label: Strings.tabClientsActive },
  { key: 'archived', label: Strings.tabClientsArchived },
];

const repo    = new CoachRemoteRepository();
const tagRepo = new TagRemoteRepository();

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ClientsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tags: coachTags, fetchTags } = useTagStore();

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ClientStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  // Tag picker state
  const [pickerAthlete, setPickerAthlete] = useState<Athlete | null>(null);

  // Create new athlete
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAthletes();
      fetchTags(user.id);
    }
  }, [user?.id]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const displayed = filterAthletes(athletes, activeTab, searchQuery);
  const counts: Record<ClientStatus, number> = {
    active:   athletes.filter((a) => a.status === 'active').length,
    archived: athletes.filter((a) => a.status === 'archived').length,
  };

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAthletes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coach_athletes')
        .select(`status, assigned_at, users!coach_athletes_athlete_id_fkey ( id, email, full_name, avatar_url )`)
        .eq('coach_id', user!.id)
        .order('assigned_at', { ascending: false });
      if (error) throw error;

      const base = (data ?? []).map((row: any) => ({
        id:          row.users.id as string,
        email:       row.users.email as string,
        full_name:   row.users.full_name as string,
        avatar_url:  row.users.avatar_url as string | undefined,
        assigned_at: row.assigned_at as string,
        status:      row.status as ClientStatus,
        lastSessionAt: null as Date | null,
        routineCount:  0,
        tags:          [] as ClientTag[],
      }));

      if (base.length === 0) {
        setAthletes([]);
        return;
      }

      const ids = base.map((a) => a.id);

      const [
        { data: sessionRows },
        { data: routineRows },
        tagsMap,
      ] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('athlete_id, started_at')
          .in('athlete_id', ids)
          .eq('status', 'completed')
          .order('started_at', { ascending: false }),
        supabase
          .from('routine_assignments')
          .select('athlete_id')
          .in('athlete_id', ids),
        tagRepo.getTagsForAthletes(ids),
      ]);

      const lastSessionMap = new Map<string, Date>();
      (sessionRows ?? []).forEach((row: any) => {
        if (!lastSessionMap.has(row.athlete_id)) {
          lastSessionMap.set(row.athlete_id, new Date(row.started_at));
        }
      });

      const routineCountMap = new Map<string, number>();
      (routineRows ?? []).forEach((row: any) => {
        routineCountMap.set(row.athlete_id, (routineCountMap.get(row.athlete_id) ?? 0) + 1);
      });

      setAthletes(base.map((a) => ({
        ...a,
        lastSessionAt: lastSessionMap.get(a.id) ?? null,
        routineCount:  routineCountMap.get(a.id) ?? 0,
        tags:          tagsMap.get(a.id) ?? [],
      })));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const openTagPicker = (athlete: Athlete) => setPickerAthlete(athlete);

  const handleTagPickerClose = (updatedIds: Set<string>) => {
    if (!pickerAthlete) return;
    const updatedTags = coachTags.filter((t) => updatedIds.has(t.id));
    setAthletes((prev) =>
      prev.map((a) => a.id === pickerAthlete.id ? { ...a, tags: updatedTags } : a),
    );
    setPickerAthlete(null);
  };

  const handleLongPress = (athlete: Athlete) => {
    if (athlete.status === 'active') {
      Alert.alert(athlete.full_name, undefined, [
        {
          text: Strings.tagManageButton,
          onPress: () => openTagPicker(athlete),
        },
        {
          text: Strings.alertArchiveConfirm,
          onPress: async () => {
            try {
              await archiveAthleteUseCase(user!.id, athlete.id, repo);
              setAthletes((prev) =>
                prev.map((a) => a.id === athlete.id ? { ...a, status: 'archived' } : a),
              );
            } catch {
              Alert.alert('Error', Strings.errorFailedArchiveClient);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    } else {
      Alert.alert(athlete.full_name, undefined, [
        {
          text: Strings.alertRestoreConfirm,
          onPress: async () => {
            try {
              await restoreAthleteUseCase(user!.id, athlete.id, repo);
              setAthletes((prev) =>
                prev.map((a) => a.id === athlete.id ? { ...a, status: 'active' } : a),
              );
            } catch {
              Alert.alert('Error', Strings.errorFailedRestoreClient);
            }
          },
        },
        {
          text: Strings.alertDeleteClientTitle,
          style: 'destructive',
          onPress: () => confirmDelete(athlete),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const confirmDelete = (athlete: Athlete) => {
    Alert.alert(
      Strings.alertDeleteClientTitle,
      Strings.alertDeleteClientMessage(athlete.full_name),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('coach_athletes').delete()
              .eq('coach_id', user!.id).eq('athlete_id', athlete.id);
            if (!error) setAthletes((prev) => prev.filter((a) => a.id !== athlete.id));
          },
        },
      ],
    );
  };

  const createAthlete = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      Alert.alert('Campos obligatorios', 'Completa nombre y email.');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-athlete', {
        body: { name: newName.trim(), email: newEmail.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newUserId: string = data.id;

      setAthletes((prev) => [{
        id: newUserId, email: newEmail.trim(), full_name: newName.trim(),
        assigned_at: new Date().toISOString(), status: 'active',
        lastSessionAt: null, routineCount: 0, tags: [],
      }, ...prev]);

      closeModal();
      Alert.alert('Invitación enviada', `Se ha enviado un email a ${newEmail.trim()} para que ${newName.trim()} establezca su contraseña.`);
    } catch (err: any) {
      Alert.alert('Error al crear atleta', err?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setNewName('');
    setNewEmail('');
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {pickerAthlete && (
        <TagPickerModal
          visible={!!pickerAthlete}
          athleteId={pickerAthlete.id}
          coachTags={coachTags}
          assignedTagIds={new Set(pickerAthlete.tags.map((t) => t.id))}
          onClose={handleTagPickerClose}
        />
      )}

      {/* ── Modal crear nuevo atleta ── */}
      <Modal visible={modalMode === 'create'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuevo atleta</Text>
            <TouchableOpacity onPress={createAthlete} disabled={creating}>
              {creating
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.saveText}>Crear</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.createForm} keyboardShouldPersistTaps="handled">
            <View style={styles.createInfo}>
              <Text style={styles.createInfoText}>
                El atleta recibirá un email de invitación para establecer su contraseña y acceder a la app.
              </Text>
            </View>
            <Field label="NOMBRE COMPLETO">
              <TextInput
                style={styles.input} value={newName} onChangeText={setNewName}
                placeholder="Ej: María García" placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </Field>
            <Field label="EMAIL">
              <TextInput
                style={styles.input} value={newEmail} onChangeText={setNewEmail}
                placeholder="atleta@email.com" placeholderTextColor={Colors.textMuted}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              />
            </Field>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accentBar} />
          <View>
            <Text style={styles.title}>Clientes</Text>
            <Text style={styles.subtitle}>
              {counts.active} activo{counts.active !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.tagsBtn} onPress={() => router.push('/(coach)/clients/tags')} activeOpacity={0.8}>
            <Text style={styles.tagsBtnText}>🏷️</Text>
          </TouchableOpacity>
          {activeTab === 'active' && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalMode('create')}>
              <Text style={styles.addBtnText}>+ Añadir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabSelected]}
            onPress={() => { setActiveTab(tab.key); setSearchQuery(''); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextSelected]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeSelected]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextSelected]}>
                {counts[tab.key]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Buscador ── */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={Strings.clientsSearchPlaceholder}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Lista ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          {searchQuery.trim() ? (
            <>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>{Strings.clientsNoResults}</Text>
              <Text style={styles.emptySubtitle}>
                {Strings.clientsNoResultsSubtitle(searchQuery.trim())}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyEmoji}>{activeTab === 'active' ? '👥' : '📦'}</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? 'Sin clientes todavía' : 'Sin clientes archivados'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'active'
                  ? 'Añade atletas para empezar a gestionarlos'
                  : 'Los clientes archivados aparecerán aquí'}
              </Text>
              {activeTab === 'active' && (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalMode('create')}>
                  <Text style={styles.emptyBtnText}>Añadir primer cliente</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.athleteCard, item.status === 'archived' && styles.athleteCardArchived]}
              onPress={() => router.push({
                pathname: '/(coach)/clients/[id]',
                params: { id: item.id, name: item.full_name },
              })}
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.avatar,
                { backgroundColor: item.status === 'archived' ? Colors.surfaceMuted : Colors.primarySubtle },
              ]}>
                <Text style={[
                  styles.avatarText,
                  { color: item.status === 'archived' ? Colors.textMuted : Colors.primary },
                ]}>
                  {getInitials(item.full_name)}
                </Text>
              </View>
              <View style={styles.athleteInfo}>
                <Text style={[
                  styles.athleteName,
                  item.status === 'archived' && styles.athleteNameArchived,
                ]}>
                  {item.full_name}
                </Text>
                <Text style={styles.athleteEmail}>{item.email}</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>
                    ⚡ {formatLastActivity(item.lastSessionAt)}
                  </Text>
                  <Text style={styles.metricSep}>·</Text>
                  <Text style={styles.metricText}>
                    📋 {Strings.clientsRoutineCount(item.routineCount)}
                  </Text>
                </View>
                {item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <View key={tag.id} style={[styles.tagChip, { backgroundColor: `${tag.color}20`, borderColor: `${tag.color}60` }]}>
                        <View style={[styles.tagChipDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.tagChipText, { color: tag.color }]}>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.background },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar:  { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title:      { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tagsBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  tagsBtnText:   { fontSize: 16 },
  addBtn:        { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  addBtnText:    { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  // ── Tabs ────────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  },
  tabSelected: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  tabText:         { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextSelected: { color: Colors.textPrimary },
  tabBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeSelected:     { backgroundColor: Colors.primarySubtle },
  tabBadgeText:         { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  tabBadgeTextSelected: { color: Colors.primary },

  // ── Search bar ────────────────────────────────────────────────────────────
  searchBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },

  // ── List ───────────────────────────────────────────────────────────────────
  list:                { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
  athleteCard:         { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  athleteCardArchived: { opacity: 0.65 },
  avatar:              { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText:          { fontSize: FontSize.md, fontWeight: '800' },
  athleteInfo:         { flex: 1, gap: 2 },
  athleteName:         { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  athleteNameArchived: { color: Colors.textSecondary },
  athleteEmail:        { fontSize: FontSize.xs, color: Colors.textSecondary },
  metricsRow:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metricText:          { fontSize: FontSize.xs, color: Colors.textMuted },
  metricSep:           { fontSize: FontSize.xs, color: Colors.borderLight },
  tagsRow:             { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tagChip:             { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  tagChipDot:          { width: 6, height: 6, borderRadius: 3 },
  tagChipText:         { fontSize: 10, fontWeight: '700' },
  chevron:             { fontSize: 22, color: Colors.textMuted },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
  emptyBtn:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  emptyBtnText:  { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // ── Modals ─────────────────────────────────────────────────────────────────
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancelText:   { color: Colors.textSecondary, fontSize: FontSize.sm, width: 70 },
  saveText:     { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700', width: 70, textAlign: 'right' },
  modalTitle:   { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  createForm:   { padding: Spacing.lg, gap: Spacing.md },
  createInfo:   { backgroundColor: Colors.primarySubtle, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.primary}25` },
  createInfoText: { fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
  field:          { gap: Spacing.xs },
  fieldLabel:     { fontSize: FontSize.xs, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  input:          { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md },

});
