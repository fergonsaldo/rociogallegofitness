import {
  View, Text, FlatList, TouchableOpacity, Modal,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { Routine, RoutineDay } from '../../../src/domain/entities/Routine';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { findExerciseById } from '../../../src/shared/constants/exercises';

export default function AthleteWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { routines, isLoading, error, fetchAthleteRoutines, selectRoutine } = useRoutineStore();

  const [dayPickerRoutine, setDayPickerRoutine] = useState<Routine | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchAthleteRoutines(user.id);
    }, [user?.id]),
  );

  const handleStartRoutine = (routine: Routine) => {
    selectRoutine(routine);
    if (routine.days.length === 1) {
      // Una sola jornada — navegar directamente
      navigateToSession(routine, routine.days[0]);
    } else {
      // Varias jornadas — mostrar selector
      setDayPickerRoutine(routine);
    }
  };

  const navigateToSession = (routine: Routine, day: RoutineDay) => {
    setDayPickerRoutine(null);
    selectRoutine(routine);
    router.push({
      pathname: '/(athlete)/workout/session',
      params: { routineDayId: day.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.accentBar} />
          <View>
            <Text style={styles.title}>Mis rutinas</Text>
            <Text style={styles.subtitle}>Asignadas por tu entrenador</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.athlete} size="large" />
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>Sin rutinas todavía</Text>
            <Text style={styles.emptySubtitle}>Tu entrenador aún no te ha asignado ninguna rutina</Text>
          </View>
        ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <RoutineRow routine={item} onStart={handleStartRoutine} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* ── Selector de día ── */}
      <Modal
        visible={dayPickerRoutine !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDayPickerRoutine(null)}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDayPickerRoutine(null)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Elige el día</Text>
            <View style={{ width: 70 }} />
          </View>
          {dayPickerRoutine && (
            <FlatList
              data={dayPickerRoutine.days}
              keyExtractor={(d) => d.id}
              contentContainerStyle={styles.dayList}
              renderItem={({ item: day }) => (
                <TouchableOpacity
                  style={styles.dayCard}
                  onPress={() => navigateToSession(dayPickerRoutine, day)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{day.dayNumber}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.name}</Text>
                    <Text style={styles.dayMeta}>{day.exercises.length} ejercicios</Text>
                  </View>
                  <Text style={styles.dayChevron}>▶</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function RoutineRow({ routine, onStart }: { routine: Routine; onStart: (r: Routine) => void }) {
  const totalExercises = routine.days.reduce((s, d) => s + d.exercises.length, 0);
  const muscles = [...new Set(
    routine.days.flatMap((d) =>
      d.exercises.flatMap((e) => findExerciseById(e.exerciseId)?.primaryMuscles ?? [])
    )
  )].slice(0, 3);

  return (
    <View style={styles.routineCard}>
      <View style={styles.routineInfo}>
        <Text style={styles.routineName}>{routine.name}</Text>
        {routine.description && (
          <Text style={styles.routineDesc} numberOfLines={1}>{routine.description}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>📅 {routine.days.length} días</Text>
          <Text style={styles.metaChip}>🏋️ {Math.round(totalExercises / routine.days.length)} ej/día</Text>
          {routine.durationWeeks && (
            <Text style={styles.metaChip}>📆 {routine.durationWeeks} sem</Text>
          )}
        </View>
        {muscles.length > 0 && (
          <View style={styles.muscleRow}>
            {muscles.map((m) => (
              <View key={m} style={styles.muscleBadge}>
                <Text style={styles.muscleBadgeText}>{m}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => onStart(routine)}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>▶  Iniciar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  accentBar: { width: 4, height: 32, backgroundColor: Colors.athlete, borderRadius: 2 },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  list: { gap: Spacing.md, paddingBottom: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  errorBanner: {
    backgroundColor: `${Colors.error}15`, borderWidth: 1,
    borderColor: `${Colors.error}30`, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },

  // Tarjeta de rutina
  routineCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  routineInfo: { gap: Spacing.xs },
  routineName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  routineDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  metaChip: { fontSize: FontSize.xs, color: Colors.textSecondary },
  muscleRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginTop: Spacing.xs },
  muscleBadge: {
    backgroundColor: `${Colors.athlete}15`, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  muscleBadgeText: { fontSize: FontSize.xs, color: Colors.athlete, fontWeight: '600', textTransform: 'capitalize' },
  startButton: {
    backgroundColor: Colors.athlete, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  startButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md, letterSpacing: 0.5 },

  // Modal selector de día
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalCancel: { color: Colors.textSecondary, fontSize: FontSize.sm, width: 70 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  dayList: { padding: Spacing.lg, gap: Spacing.md },
  dayCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  dayBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.athlete, alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeText: { color: '#fff', fontWeight: '800', fontSize: FontSize.md },
  dayInfo: { flex: 1 },
  dayName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  dayMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  dayChevron: { color: Colors.athlete, fontSize: FontSize.md, fontWeight: '700' },
});
