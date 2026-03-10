import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { supabase } from '../../../src/infrastructure/supabase/client';
import { findExerciseById } from '../../../src/shared/constants/exercises';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface ClientOption {
  id: string;
  full_name: string;
  email: string;
  alreadyAssigned: boolean;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { selectedRoutine, isLoading, error, fetchRoutineById, deleteRoutine, assignToAthlete, clearError } =
    useRoutineStore();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  console.log('[RoutineDetail] render — id:', id, 'isLoading:', isLoading, 'error:', error);
  console.log('[RoutineDetail] selectedRoutine:', selectedRoutine?.id, selectedRoutine?.name);

  useEffect(() => {
    console.log('[RoutineDetail] useEffect — id:', id, 'selectedRoutine:', selectedRoutine?.id);
    if (id && (!selectedRoutine || selectedRoutine.id !== id)) {
      fetchRoutineById(id);
    }
  }, [id]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenAssignModal = async () => {
    console.log('[RoutineDetail] handleOpenAssignModal — routineId:', selectedRoutine?.id);
    console.log('[RoutineDetail] coachId:', user?.id);

    clearError();        // limpia cualquier error previo del store
    setClientsError(null);
    setAssignModalVisible(true);
    setLoadingClients(true);

    try {
      console.log('[RoutineDetail] fetching coach clients from Supabase...');
      const { data: coachAthletes, error: coachError } = await supabase
        .from('coach_athletes')
        .select('users!coach_athletes_athlete_id_fkey ( id, full_name, email )')
        .eq('coach_id', user!.id);

      console.log('[RoutineDetail] coachAthletes result:', {
        count: coachAthletes?.length,
        error: coachError?.message ?? 'none',
      });

      if (coachError) throw coachError;

      const athleteList = (coachAthletes ?? []).map((row: any) => row.users).filter(Boolean);
      console.log('[RoutineDetail] athleteList ids:', athleteList.map((a: any) => a.id));

      if (athleteList.length === 0) {
        setClients([]);
        setLoadingClients(false);
        return;
      }

      // Consultar qué atletas ya tienen esta rutina asignada
      console.log('[RoutineDetail] fetching existing assignments for routineId:', id);
      const { data: assignments, error: assignError } = await supabase
        .from('routine_assignments')
        .select('athlete_id')
        .eq('routine_id', id);

      console.log('[RoutineDetail] assignments result:', {
        count: assignments?.length,
        error: assignError?.message ?? 'none',
        athleteIds: assignments?.map((a: any) => a.athlete_id),
      });

      if (assignError) throw assignError;

      const assignedIds = new Set((assignments ?? []).map((a: any) => a.athlete_id));

      const clientOptions: ClientOption[] = athleteList.map((athlete: any) => ({
        id: athlete.id,
        full_name: athlete.full_name,
        email: athlete.email,
        alreadyAssigned: assignedIds.has(athlete.id),
      }));

      console.log('[RoutineDetail] clientOptions built:', clientOptions.map((c) => ({
        id: c.id, name: c.full_name, alreadyAssigned: c.alreadyAssigned,
      })));

      setClients(clientOptions);
    } catch (err) {
      const msg = err instanceof Error ? err.message : Strings.errorFailedLoadClients;
      console.error('[RoutineDetail] handleOpenAssignModal error:', err);
      setClientsError(msg);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleAssignToClient = async (client: ClientOption) => {
    if (client.alreadyAssigned) {
      console.log('[RoutineDetail] handleAssignToClient — ya asignada, ignorando. clientId:', client.id);
      return;
    }

    console.log('[RoutineDetail] handleAssignToClient — routineId:', selectedRoutine?.id, 'clientId:', client.id);
    setAssigningId(client.id);
    clearError();

    await assignToAthlete(selectedRoutine!.id, client.id);

    console.log('[RoutineDetail] handleAssignToClient — store.assignToAthlete completado');

    // Marcar como asignada en la lista local sin recargar
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, alreadyAssigned: true } : c))
    );
    setAssigningId(null);

    Alert.alert('✓', Strings.assignRoutineSuccess(client.full_name), [
      {
        text: 'OK',
        onPress: () => {
          setAssignModalVisible(false);
          router.push({
            pathname: '/(coach)/clients/[id]',
            params: { id: client.id, name: client.full_name },
          });
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!selectedRoutine) return;
    Alert.alert(
      Strings.alertDeleteRoutineTitle,
      Strings.alertDeleteRoutineMessage(selectedRoutine.name),
      [
        { text: Strings.alertDeleteRoutineCancel, style: 'cancel' },
        {
          text: Strings.alertDeleteRoutineConfirm,
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRoutine(selectedRoutine.id);
            if (success) router.back();
          },
        },
      ],
    );
  };

  // ── Estados de carga / error ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !selectedRoutine) {
    console.error('[RoutineDetail] error state:', error);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorMsg}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedRoutine) {
    console.warn('[RoutineDetail] no selectedRoutine, id:', id);
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorTitle}>Rutina no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('[RoutineDetail] days:', selectedRoutine.days?.length);
  const totalExercises = selectedRoutine.days.reduce((s, d) => s + d.exercises.length, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Topbar ── */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.assignButton} onPress={handleOpenAssignModal}>
            <Text style={styles.assignButtonText}>Asignar a atleta</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Banner de error del store (p.ej. al asignar) ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* ── Contenido de la rutina ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.routineName}>{selectedRoutine.name}</Text>
          {selectedRoutine.description && (
            <Text style={styles.routineDescription}>{selectedRoutine.description}</Text>
          )}
          <View style={styles.metaRow}>
            <MetaPill emoji="📅" label={`${selectedRoutine.days.length} días`} />
            <MetaPill emoji="🏋️" label={`${totalExercises} ejercicios`} />
            {selectedRoutine.durationWeeks && (
              <MetaPill emoji="📆" label={`${selectedRoutine.durationWeeks} semanas`} />
            )}
          </View>
        </View>

        <View style={styles.daysContainer}>
          {selectedRoutine.days.map((day) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>{day.dayNumber}</Text>
                </View>
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayExCount}>{day.exercises.length} ej.</Text>
              </View>

              {day.exercises.map((ex) => {
                const exercise = findExerciseById(ex.exerciseId);
                console.log('[RoutineDetail] exercise:', ex.exerciseId, '→', exercise?.name);
                return (
                  <View key={ex.id} style={styles.exerciseRow}>
                    <View style={styles.exerciseOrder}>
                      <Text style={styles.exerciseOrderText}>{ex.order}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise?.name ?? ex.exerciseId}</Text>
                      <Text style={styles.exerciseMeta}>
                        {ex.targetSets} series ·{' '}
                        {ex.targetReps ? `${ex.targetReps} reps` : `${ex.targetDurationSeconds}s`}
                        {' '}· {ex.restBetweenSetsSeconds}s descanso
                      </Text>
                    </View>
                    {exercise && (
                      <Text style={styles.exerciseMuscle}>
                        {exercise.primaryMuscles[0]}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Modal de asignación ── */}
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <SafeAreaView style={styles.safe}>
          {/* Cabecera del modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{Strings.assignRoutineTitle}</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <Text style={styles.modalSubtitle}>{Strings.assignRoutineSubtitle}</Text>

          {/* Cuerpo del modal */}
          {loadingClients ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : clientsError ? (
            <View style={styles.center}>
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={styles.errorMsg}>{clientsError}</Text>
            </View>
          ) : clients.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>{Strings.assignRoutineEmpty}</Text>
            </View>
          ) : (
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.clientList}
              renderItem={({ item }) => (
                <ClientRow
                  client={item}
                  isAssigning={assigningId === item.id}
                  onPress={() => handleAssignToClient(item)}
                />
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function MetaPill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function ClientRow({
  client,
  isAssigning,
  onPress,
}: {
  client: ClientOption;
  isAssigning: boolean;
  onPress: () => void;
}) {
  const initials = client.full_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      style={[styles.clientCard, client.alreadyAssigned && styles.clientCardAssigned]}
      onPress={onPress}
      disabled={client.alreadyAssigned || isAssigning}
      activeOpacity={0.7}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>{initials}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{client.full_name}</Text>
        <Text style={styles.clientEmail}>{client.email}</Text>
      </View>
      {isAssigning ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : client.alreadyAssigned ? (
        <View style={styles.assignedBadge}>
          <Text style={styles.assignedBadgeText}>{Strings.assignRoutineAlreadyAssigned}</Text>
        </View>
      ) : (
        <Text style={styles.assignIcon}>＋</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },

  // Topbar
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  deleteButton: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.error}15`, borderWidth: 1, borderColor: `${Colors.error}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 16 },
  assignButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  assignButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  // Banner de error
  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderBottomWidth: 1,
    borderBottomColor: `${Colors.error}30`, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  errorBannerText: { color: Colors.error, fontSize: FontSize.sm },

  // Tarjeta de cabecera de rutina
  headerCard: {
    backgroundColor: Colors.surface, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  routineName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  routineDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  pillEmoji: { fontSize: 12 },
  pillLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },

  // Días y ejercicios
  daysContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },
  dayCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.primarySubtle,
  },
  dayBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
  dayName: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  dayExCount: { fontSize: FontSize.xs, color: Colors.textSecondary },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  exerciseOrder: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center',
  },
  exerciseOrderText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '700' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  exerciseMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  exerciseMuscle: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', textTransform: 'capitalize' },

  // Estados vacío / error
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  errorMsg: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center', paddingHorizontal: Spacing.lg },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalCancelText: { color: Colors.textSecondary, fontSize: FontSize.sm, width: 70 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  modalHeaderSpacer: { width: 70 },
  modalSubtitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  clientList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },

  // Fila de cliente en el modal
  clientCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  clientCardAssigned: { opacity: 0.5 },
  clientAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center',
  },
  clientAvatarText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  clientInfo: { flex: 1 },
  clientName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  clientEmail: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  assignIcon: { fontSize: 24, color: Colors.primary, fontWeight: '700' },
  assignedBadge: {
    backgroundColor: Colors.primarySubtle,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  assignedBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
});
