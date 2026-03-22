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
import {
  archiveAthleteUseCase,
  restoreAthleteUseCase,
} from '../../../src/application/coach/ClientUseCases';
import { ClientStatus } from '../../../src/domain/repositories/ICoachRepository';

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

interface AvailableAthlete {
  id: string;
  email: string;
  full_name: string;
}

type ModalMode = 'menu' | 'link' | 'create';

const TABS: { key: ClientStatus; label: string }[] = [
  { key: 'active',   label: Strings.tabClientsActive },
  { key: 'archived', label: Strings.tabClientsArchived },
];

const repo = new CoachRemoteRepository();

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ClientsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ClientStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  // Search / link
  const [available, setAvailable] = useState<AvailableAthlete[]>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  // Create new athlete
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.id) fetchAthletes();
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
      }));

      if (base.length === 0) {
        setAthletes([]);
        return;
      }

      const ids = base.map((a) => a.id);

      const [{ data: sessionRows }, { data: routineRows }] = await Promise.all([
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
      })));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleLongPress = (athlete: Athlete) => {
    if (athlete.status === 'active') {
      Alert.alert(
        Strings.alertArchiveClientTitle,
        Strings.alertArchiveClientMessage(athlete.full_name),
        [
          { text: Strings.alertArchiveCancel, style: 'cancel' },
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
        ],
      );
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

  const searchAthletes = async (query: string) => {
    setSearch(query);
    if (query.length < 2) { setAvailable([]); return; }
    setSearching(true);
    try {
      const existingIds = [user!.id, ...athletes.map((a) => a.id)];
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('role', 'athlete')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(10);
      if (error) throw error;
      setAvailable(data ?? []);
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const linkAthlete = async (athlete: AvailableAthlete) => {
    setAdding(true);
    try {
      const { error } = await supabase
        .from('coach_athletes')
        .insert({ coach_id: user!.id, athlete_id: athlete.id, status: 'active' });
      if (error) throw error;
      setAthletes((prev) => [
        { ...athlete, assigned_at: new Date().toISOString(), status: 'active', lastSessionAt: null, routineCount: 0 },
        ...prev,
      ]);
      closeModal();
    } catch {
      Alert.alert('Error', 'No se pudo vincular el atleta.');
    } finally {
      setAdding(false);
    }
  };

  const createAthlete = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      Alert.alert('Campos obligatorios', 'Completa nombre, email y contraseña.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Contraseña demasiado corta', 'Mínimo 6 caracteres.');
      return;
    }
    setCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.admin
        ? await (supabase.auth as any).admin.createUser({
            email: newEmail.trim(),
            password: newPassword,
            email_confirm: true,
          })
        : await supabase.auth.signUp({
            email: newEmail.trim(),
            password: newPassword,
            options: { data: { full_name: newName.trim(), role: 'athlete' } },
          });

      if (authError) throw authError;
      const newUserId = authData?.user?.id;
      if (!newUserId) throw new Error('No se obtuvo el ID del usuario creado.');

      const { error: profileError } = await supabase.from('users').insert({
        id: newUserId, email: newEmail.trim(), full_name: newName.trim(),
        role: 'athlete', weight_unit: 'kg',
      });
      if (profileError && profileError.code !== '23505') throw profileError;

      const { error: linkError } = await supabase.from('coach_athletes').insert({
        coach_id: user!.id, athlete_id: newUserId, status: 'active',
      });
      if (linkError) throw linkError;

      setAthletes((prev) => [{
        id: newUserId, email: newEmail.trim(), full_name: newName.trim(),
        assigned_at: new Date().toISOString(), status: 'active',
        lastSessionAt: null, routineCount: 0,
      }, ...prev]);

      closeModal();
      Alert.alert('Atleta creado', `${newName.trim()} ya puede acceder con su email y contraseña.`);
    } catch (err: any) {
      Alert.alert('Error al crear atleta', err?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
    setSearch('');
    setAvailable([]);
    setNewName('');
    setNewEmail('');
    setNewPassword('');
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Modal menú principal ── */}
      <Modal visible={modalMode === 'menu'} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={closeModal} activeOpacity={1}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>Añadir cliente</Text>

            <TouchableOpacity style={styles.menuOption} onPress={() => setModalMode('create')}>
              <View style={styles.menuOptionIcon}>
                <Text style={styles.menuOptionEmoji}>➕</Text>
              </View>
              <View style={styles.menuOptionInfo}>
                <Text style={styles.menuOptionLabel}>Crear nuevo atleta</Text>
                <Text style={styles.menuOptionSub}>Regístralo directamente desde aquí</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => setModalMode('link')}>
              <View style={styles.menuOptionIcon}>
                <Text style={styles.menuOptionEmoji}>🔗</Text>
              </View>
              <View style={styles.menuOptionInfo}>
                <Text style={styles.menuOptionLabel}>Vincular atleta existente</Text>
                <Text style={styles.menuOptionSub}>Busca por nombre o email</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
                Crea la cuenta del atleta. Le compartirás su email y contraseña para que pueda acceder.
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
            <Field label="CONTRASEÑA INICIAL">
              <TextInput
                style={styles.input} value={newPassword} onChangeText={setNewPassword}
                placeholder="Mínimo 6 caracteres" placeholderTextColor={Colors.textMuted}
                secureTextEntry
              />
            </Field>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Modal búsqueda / vincular ── */}
      <Modal visible={modalMode === 'link'} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Vincular atleta</Text>
            <View style={{ width: 70 }} />
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput} value={search} onChangeText={searchAthletes}
              placeholder="Buscar por nombre o email..." placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </View>
          {searching && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />}
          {!searching && search.length >= 2 && available.length === 0 && (
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No se encontraron atletas</Text>
            </View>
          )}
          <FlatList
            data={available} keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.availableCard} onPress={() => linkAthlete(item)} disabled={adding}
              >
                <View style={[styles.avatar, { backgroundColor: Colors.athleteSubtle }]}>
                  <Text style={[styles.avatarText, { color: Colors.athlete }]}>
                    {getInitials(item.full_name)}
                  </Text>
                </View>
                <View style={styles.athleteInfo}>
                  <Text style={styles.athleteName}>{item.full_name}</Text>
                  <Text style={styles.athleteEmail}>{item.email}</Text>
                </View>
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            )}
          />
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
        {activeTab === 'active' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalMode('menu')}>
            <Text style={styles.addBtnText}>+ Añadir</Text>
          </TouchableOpacity>
        )}
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
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalMode('menu')}>
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
  addBtn:     { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

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
  chevron:             { fontSize: 22, color: Colors.textMuted },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
  emptyBtn:      { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm },
  emptyBtnText:  { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // ── Modals ─────────────────────────────────────────────────────────────────
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  menuSheet:       { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  menuTitle:       { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  menuOption:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  menuOptionIcon:  { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center' },
  menuOptionEmoji: { fontSize: 20 },
  menuOptionInfo:  { flex: 1 },
  menuOptionLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  menuOptionSub:   { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  menuChevron:     { fontSize: 22, color: Colors.textMuted },

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

  searchContainer: { padding: Spacing.lg },
  searchInput:     { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary },
  emptySearch:     { alignItems: 'center', marginTop: Spacing.xl },
  emptySearchText: { color: Colors.textMuted, fontSize: FontSize.sm },
  availableCard:   { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  addIcon:         { fontSize: 24, color: Colors.primary, fontWeight: '700' },
});
