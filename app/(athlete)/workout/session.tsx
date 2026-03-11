import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWorkoutStore } from '../../../src/presentation/stores/workoutStore';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';
import { useAuthStore } from '../../../src/presentation/stores/authStore';
import { RestTimer } from '../../../src/presentation/components/athlete/RestTimer';
import { SetLogger } from '../../../src/presentation/components/athlete/SetLogger';
import { WorkoutSummaryModal } from '../../../src/presentation/components/athlete/WorkoutSummaryModal';
import { findExerciseById } from '../../../src/shared/constants/exercises';
import { ExerciseSet, isRepsPerformance, isIsometricPerformance } from '../../../src/domain/entities/ExerciseSet';
import { Colors, Spacing, FontSize, BorderRadius } from '../../../src/shared/constants/theme';
import { Strings } from '../../../src/shared/constants/strings';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { routineDayId } = useLocalSearchParams<{ routineDayId?: string }>();
  const { user } = useAuthStore();
  const { routines } = useRoutineStore();
  const {
    session, lastSummary, isLoading, error,
    startSession, logSet, finishSession, abandonSession,
    startRestTimer, clearSummary, clearError,
  } = useWorkoutStore();

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  // Inicializar con el tiempo real ya transcurrido si la sesión estaba en curso.
  // Esto evita que el cronómetro se reinicie al volver a la pantalla.
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!session?.startedAt) return 0;
    return Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
  });

  // Usar una ref para evitar que startSession se llame más de una vez
  // aunque el efecto se re-evalúe por cambios de dependencia.
  const sessionStarted = useRef(false);

  const selectedRoutine = routines.find((r) => r.days.some((d) => d.id === routineDayId)) ?? null;
  const routineDay = selectedRoutine?.days.find((d) => d.id === routineDayId)
    ?? selectedRoutine?.days[0];

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Arrancar sesión: se dispara cuando routineDay y user están listos,
  // y solo si aún no hay sesión activa ni se ha llamado ya.
  const handleStartSession = useCallback(() => {
    if (session || sessionStarted.current || !user?.id || !routineDay) return;
    sessionStarted.current = true;
    startSession(user.id, selectedRoutine?.id, routineDay.id);
  }, [session, user?.id, routineDay, selectedRoutine?.id, startSession]);

  useEffect(() => {
    handleStartSession();
  }, [handleStartSession]);

  // Mostrar resumen cuando la sesión termina
  useEffect(() => {
    if (lastSummary) setShowSummary(true);
  }, [lastSummary]);

  const handleLogSet = async (performance: any) => {
    if (!routineDay) return;
    const exercise = routineDay.exercises[activeExerciseIndex];
    if (!exercise) return;

    const newSet = await logSet({ exerciseId: exercise.exerciseId, performance, restAfterSeconds: exercise.restBetweenSetsSeconds });
    if (newSet) startRestTimer(exercise.restBetweenSetsSeconds);
  };

  const handleFinish = () => {
    Alert.alert('¿Terminar entrenamiento?', 'Tus series se guardarán y sincronizarán.', [
      { text: Strings.alertFinishCancel, style: 'cancel' },
      { text: Strings.alertFinishConfirm, style: 'default', onPress: () => finishSession() },
    ]);
  };

  const handleAbandon = () => {
    Alert.alert('¿Abandonar el entrenamiento?', 'Se perderá el progreso.', [
      { text: Strings.alertAbandonContinue, style: 'cancel' },
      { text: Strings.alertAbandonConfirm, style: 'destructive', onPress: async () => { await abandonSession(); router.back(); } },
    ]);
  };

  const handleSummaryClose = () => {
    clearSummary();
    setShowSummary(false);
    router.replace('/(athlete)/dashboard');
  };

  const elapsed = (() => {
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  if (isLoading && !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.athlete} size="large" />
          <Text style={styles.loadingText}>Iniciando entrenamiento…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {showSummary && lastSummary && (
        <WorkoutSummaryModal summary={lastSummary} onClose={handleSummaryClose} />
      )}

      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarTitle}>{routineDay?.name ?? 'Entrenamiento libre'}</Text>
          <Text style={styles.topbarTimer}>⏱ {elapsed}</Text>
        </View>
        <View style={styles.topbarActions}>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.8}>
            <Text style={styles.finishButtonText}>Terminar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAbandon} style={styles.abandonButton}>
            <Text style={styles.abandonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RestTimer />

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}><Text style={styles.errorDismiss}>✕</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {routineDay && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseTabs}>
            {routineDay.exercises.map((re, idx) => {
              const exercise = findExerciseById(re.exerciseId);
              const setsLogged = session?.sets.filter((s) => s.exerciseId === re.exerciseId).length ?? 0;
              const isActive = idx === activeExerciseIndex;
              const isDone = setsLogged >= re.targetSets;

              return (
                <TouchableOpacity
                  key={re.id}
                  style={[styles.exerciseTab, isActive && styles.exerciseTabActive, isDone && styles.exerciseTabDone]}
                  onPress={() => setActiveExerciseIndex(idx)}
                >
                  <Text style={[styles.exerciseTabText, isActive && styles.exerciseTabTextActive]}>
                    {exercise?.name ?? Strings.fallbackExercise}
                  </Text>
                  <Text style={[styles.exerciseTabProgress, isDone && styles.exerciseTabProgressDone]}>
                    {setsLogged}/{re.targetSets}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {routineDay && routineDay.exercises[activeExerciseIndex] && (() => {
          const re = routineDay.exercises[activeExerciseIndex];
          const exercise = findExerciseById(re.exerciseId);
          if (!exercise) return null;

          const sessionSetsForExercise = (session?.sets ?? []).filter(
            (s) => s.exerciseId === re.exerciseId
          );
          const nextSetNumber = sessionSetsForExercise.length + 1;
          const previousSet = sessionSetsForExercise[sessionSetsForExercise.length - 1] as ExerciseSet | undefined;
          const allSetsLogged = sessionSetsForExercise.length >= re.targetSets;

          return (
            <View style={styles.exerciseSection}>
              <View style={styles.exerciseHeader}>
                <View>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise.primaryMuscles.join(', ')} · {re.targetSets} sets ·{' '}
                    {re.targetReps ? `${re.targetReps} reps` : `${re.targetDurationSeconds}s`}
                  </Text>
                </View>
                <View style={[styles.setsProgressBadge, allSetsLogged && styles.setsProgressBadgeDone]}>
                  <Text style={[styles.setsProgressText, allSetsLogged && styles.setsProgressTextDone]}>
                    {sessionSetsForExercise.length}/{re.targetSets}
                  </Text>
                </View>
              </View>

              {sessionSetsForExercise.map((s, i) => (
                <View key={s.id} style={styles.loggedSet}>
                  <View style={styles.loggedSetBadge}>
                    <Text style={styles.loggedSetBadgeText}>✓</Text>
                  </View>
                  <Text style={styles.loggedSetText}>
                    Serie {i + 1} ·{' '}
                    {s.performance.type === 'reps'
                      ? `${isRepsPerformance(s.performance) ? s.performance.weightKg : 0} kg × ${isRepsPerformance(s.performance) ? s.performance.reps : 0} reps`
                      : `${isIsometricPerformance(s.performance) ? s.performance.durationSeconds : 0}s`}
                  </Text>
                </View>
              ))}

              {!allSetsLogged && (
                <View style={styles.setLoggerWrapper}>
                  <Text style={styles.nextSetLabel}>SERIE {nextSetNumber}</Text>
                  <SetLogger
                    exercise={exercise}
                    setNumber={nextSetNumber}
                    previousSet={previousSet}
                    onLog={handleLogSet}
                  />
                </View>
              )}

              {allSetsLogged && (
                <View style={styles.exerciseCompleteBanner}>
                  <Text style={styles.exerciseCompleteText}>✓ ¡Ejercicio completado!</Text>
                </View>
              )}

              <Text style={styles.restHint}>Descanso: {re.restBetweenSetsSeconds}s entre series</Text>
            </View>
          );
        })()}

        {session && session.sets.length > 0 && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>PROGRESO DE LA SESIÓN</Text>
            <Text style={styles.progressValue}>{session.sets.length} series registradas</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  topbarTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  topbarTimer: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  finishButton: {
    backgroundColor: Colors.athlete, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    shadowColor: Colors.athlete, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  finishButtonText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  abandonButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceMuted,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  abandonText: { color: Colors.textSecondary, fontSize: FontSize.md },
  scroll: { flex: 1 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: `${Colors.error}15`, borderBottomWidth: 1,
    borderBottomColor: `${Colors.error}30`, padding: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm, flex: 1 },
  errorDismiss: { color: Colors.error, fontSize: FontSize.md, paddingLeft: Spacing.sm },
  exerciseTabs: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  exerciseTab: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginRight: Spacing.sm, backgroundColor: Colors.surface, alignItems: 'center', gap: 2,
  },
  exerciseTabActive: { borderColor: Colors.athlete, backgroundColor: Colors.athleteSubtle },
  exerciseTabDone: { borderColor: Colors.success, backgroundColor: `${Colors.success}12` },
  exerciseTabText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', maxWidth: 80 },
  exerciseTabTextActive: { color: Colors.athlete },
  exerciseTabProgress: { fontSize: 10, color: Colors.textMuted, fontWeight: '700' },
  exerciseTabProgressDone: { color: Colors.success },
  exerciseSection: {
    margin: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  exerciseName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  exerciseMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  setsProgressBadge: {
    backgroundColor: Colors.surfaceMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  setsProgressBadgeDone: { backgroundColor: `${Colors.success}15`, borderColor: `${Colors.success}40` },
  setsProgressText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  setsProgressTextDone: { color: Colors.success },
  loggedSet: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  loggedSetBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: `${Colors.success}20`, alignItems: 'center', justifyContent: 'center',
  },
  loggedSetBadgeText: { color: Colors.success, fontSize: 11, fontWeight: '800' },
  loggedSetText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  setLoggerWrapper: { gap: Spacing.xs },
  nextSetLabel: { fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 2, fontWeight: '600' },
  exerciseCompleteBanner: {
    backgroundColor: `${Colors.success}12`, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: `${Colors.success}30`,
    padding: Spacing.md, alignItems: 'center',
  },
  exerciseCompleteText: { color: Colors.success, fontWeight: '700', fontSize: FontSize.sm },
  restHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  progressSection: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.primarySubtle,
    borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: `${Colors.primary}25`, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  progressLabel: { fontSize: FontSize.xs, color: Colors.primary, letterSpacing: 2, fontWeight: '600' },
  progressValue: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
});
