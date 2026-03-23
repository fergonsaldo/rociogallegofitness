import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { RoutineCard } from '../../../src/presentation/components/common/RoutineCard';
import { Routine } from '../../../src/domain/entities/Routine';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';
import { supabase } from '../../../src/infrastructure/supabase/client';

// ── Pure filter function (exported for testing) ────────────────────────────

export function filterRoutines(routines: Routine[], query: string): Routine[] {
  if (!query.trim()) return routines;
  const q = query.toLowerCase().trim();
  return routines.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q),
  );
}

// ── Types ─────────────────────────────────────────────────────────────────

interface AthleteOption {
  id: string;
  full_name: string;
  email: string;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CoachRoutinesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { routines, isLoading, error, fetchCoachRoutines, selectRoutine, assignMultipleToAthlete } =
    useRoutineStore();

  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchCoachRoutines(user.id);
    }, [user?.id]),
  );

  const filtered = filterRoutines(routines, query);

  // ── Selection mode ────────────────────────────────────────────────────

  const handleLongPress = (routine: Routine) => {
    setSelectMode(true);
    setSelectedIds(new Set([routine.id]));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) setSelectMode(false);
      return next;
    });
  };

  const handlePress = (routine: Routine) => {
    if (selectMode) {
      handleToggleSelect(routine.id);
      return;
    }
    selectRoutine(routine);
    router.push(`/(coach)/routines/${routine.id}`);
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // ── Bulk assign ────────────────────────────────────────────────────────

  const handleOpenModal = async () => {
    setModalVisible(true);
    setLoadingAthletes(true);
    try {
      const { data, error: err } = await supabase
        .from('coach_athletes')
        .select('users!coach_athletes_athlete_id_fkey ( id, full_name, email )')
        .eq('coach_id', user!.id);
      if (err) throw err;
      const list: AthleteOption[] = (data ?? [])
        .map((row: any) => row.users)
        .filter(Boolean);
      setAthletes(list);
    } catch {
      setAthletes([]);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const handleAssign = async (athlete: AthleteOption) => {
    setAssigningId(athlete.id);
    const ids = Array.from(selectedIds);
    const ok = await assignMultipleToAthlete(ids, athlete.id);
    setAssigningId(null);
    if (ok) {
      setModalVisible(false);
      handleCancelSelect();
      Alert.alert('✓', Strings.routineBulkAssignSuccess(ids.length, athlete.full_name));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.accentBar} />
            <View>
              <Text style={styles.title}>{Strings.tabRoutines}</Text>
              <Text style={styles.subtitle}>{Strings.routineSubtitle(routines.length)}</Text>
            </View>
          </View>
          {selectMode ? (
            <TouchableOpacity onPress={handleCancelSelect} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(coach)/routines/create')}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>{Strings.routineNewButton}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.routineSearchPlaceholder}
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        {/* Bulk-assign bar */}
        {selectMode && selectedIds.size > 0 && (
          <TouchableOpacity style={styles.bulkBar} onPress={handleOpenModal}>
            <Text style={styles.bulkBarCount}>{Strings.routineSelectionCount(selectedIds.size)}</Text>
            <Text style={styles.bulkBarAction}>{Strings.routineBulkAssignButton}</Text>
          </TouchableOpacity>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{Strings.routineEmptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{Strings.routineEmptySubtitle}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(coach)/routines/create')}
            >
              <Text style={styles.emptyButtonText}>{Strings.routineEmptyButton}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>{Strings.routineEmptySearch}</Text>
            <Text style={styles.emptySubtitle}>{Strings.routineEmptySearchSubtitle(query)}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                {selectMode && (
                  <View style={[
                    styles.checkbox,
                    selectedIds.has(item.id) && styles.checkboxSelected,
                  ]}>
                    {selectedIds.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                )}
                <View style={styles.cardFlex}>
                  <RoutineCard
                    routine={item}
                    onPress={handlePress}
                    onLongPress={handleLongPress}
                    accentColor={selectedIds.has(item.id) ? Colors.primary : Colors.surface}
                  />
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Athlete picker modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{Strings.assignRoutineTitle}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <Text style={styles.modalSubtitle}>{Strings.assignRoutineSubtitle}</Text>

            {loadingAthletes ? (
              <View style={styles.center}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            ) : athletes.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyText}>{Strings.assignRoutineEmpty}</Text>
              </View>
            ) : (
              <FlatList
                data={athletes}
                keyExtractor={(a) => a.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.athleteRow}
                    onPress={() => handleAssign(item)}
                    disabled={assigningId !== null}
                  >
                    <View style={styles.athleteAvatar}>
                      <Text style={styles.athleteAvatarText}>
                        {item.full_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.athleteInfo}>
                      <Text style={styles.athleteName}>{item.full_name}</Text>
                      <Text style={styles.athleteEmail}>{item.email}</Text>
                    </View>
                    {assigningId === item.id ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <Text style={styles.assignIcon}>＋</Text>
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.athleteList}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.primary, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  createButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  createButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  cancelButton: {
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.textSecondary,
  },
  cancelButtonText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  // Search
  searchInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },

  // Bulk bar
  bulkBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm,
  },
  bulkBarCount: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  bulkBarAction: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  // List
  list: { gap: Spacing.md, paddingBottom: Spacing.xl },
  cardWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardFlex: { flex: 1 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Empty states
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
  emptyButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // Error
  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1,
    borderColor: `${Colors.error}30`, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  // Modal
  modalContainer: { flex: 1, paddingHorizontal: Spacing.lg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.lg,
  },
  modalHeaderSpacer: { width: 60 },
  modalCancelText: { color: Colors.primary, fontSize: FontSize.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  athleteList: { paddingBottom: Spacing.xl },
  athleteRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  athleteAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  athleteAvatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  athleteInfo: { flex: 1 },
  athleteName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  athleteEmail: { fontSize: FontSize.xs, color: Colors.textSecondary },
  assignIcon: { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700' },
});
