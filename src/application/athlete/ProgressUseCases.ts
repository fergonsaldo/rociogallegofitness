import { WorkoutSession } from '@/domain/entities/WorkoutSession';
import { ProgressRecord } from '@/domain/entities/ProgressRecord';
import { IWorkoutRepository } from '@/domain/repositories/IWorkoutRepository';
import { IProgressRepository } from '@/domain/repositories/IProgressRepository';
import { calculateTotalVolume } from '@/domain/value-objects/Volume';
import { estimateOneRepMax } from '@/domain/value-objects/OneRepMax';

// ── GetWorkoutHistory ─────────────────────────────────────────────────────────

export interface WorkoutHistoryEntry {
  session: WorkoutSession;
  totalVolumeKg: number;
  totalSets: number;
  durationMinutes: number;
  exerciseCount: number;
}

/**
 * Returns paginated workout history for an athlete, enriched with
 * session-level metrics computed from the logged sets.
 */
export async function getWorkoutHistoryUseCase(
  athleteId: string,
  workoutRepo: IWorkoutRepository,
  limit = 20
): Promise<WorkoutHistoryEntry[]> {
  if (!athleteId) throw new Error('athleteId is required');

  const sessions = await workoutRepo.getSessionHistory(athleteId, limit);

  return sessions.map((session) => {
    const repsSets = session.sets
      .filter((s) => s.performance.type === 'reps')
      .map((s) => ({
        reps: (s.performance as any).reps as number,
        weightKg: (s.performance as any).weightKg as number,
      }));

    const totalVolumeKg = calculateTotalVolume(repsSets);
    const totalSets = session.sets.length;
    const exerciseCount = new Set(session.sets.map((s) => s.exerciseId)).size;
    const durationMinutes = session.finishedAt
      ? Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000)
      : 0;

    return { session, totalVolumeKg, totalSets, durationMinutes, exerciseCount };
  });
}

// ── GetExerciseProgression ────────────────────────────────────────────────────

export interface ExerciseProgressionPoint {
  date: Date;
  estimatedOneRepMaxKg?: number;
  bestWeightKg?: number;
  bestReps?: number;
  totalVolumeKg: number;
  sessionId: string;
}

/**
 * Returns the progression history for a single exercise.
 * Each point represents one workout session where that exercise was performed.
 */
export async function getExerciseProgressionUseCase(
  athleteId: string,
  exerciseId: string,
  progressRepo: IProgressRepository
): Promise<ExerciseProgressionPoint[]> {
  if (!athleteId) throw new Error('athleteId is required');
  if (!exerciseId) throw new Error('exerciseId is required');

  const records = await progressRepo.getByAthleteAndExercise(athleteId, exerciseId);

  return records.map((r) => ({
    date: r.recordedAt,
    estimatedOneRepMaxKg: r.estimatedOneRepMaxKg,
    bestWeightKg: r.bestWeightKg,
    bestReps: r.bestReps,
    totalVolumeKg: r.totalVolumeKg,
    sessionId: r.sessionId,
  }));
}

// ── GetPersonalBests ──────────────────────────────────────────────────────────

export interface PersonalBestSnapshot {
  exerciseId: string;
  estimatedOneRepMaxKg?: number;
  bestWeightKg?: number;
  bestReps?: number;
  achievedAt: Date;
}

/**
 * Returns one personal best per exercise the athlete has trained.
 * Used for the "My PRs" section of the progress screen.
 */
export async function getPersonalBestsUseCase(
  athleteId: string,
  progressRepo: IProgressRepository
): Promise<PersonalBestSnapshot[]> {
  if (!athleteId) throw new Error('athleteId is required');

  const latestRecords = await progressRepo.getLatestPerExercise(athleteId);

  return latestRecords.map((r) => ({
    exerciseId: r.exerciseId,
    estimatedOneRepMaxKg: r.estimatedOneRepMaxKg,
    bestWeightKg: r.bestWeightKg,
    bestReps: r.bestReps,
    achievedAt: r.recordedAt,
  }));
}

// ── SaveProgressRecords ───────────────────────────────────────────────────────

/**
 * Derives and saves ProgressRecords from a finished WorkoutSession.
 * Called by SyncService after successfully pushing a session to Supabase.
 * One record is saved per unique exercise in the session.
 */
export async function saveProgressRecordsUseCase(
  session: WorkoutSession,
  progressRepo: IProgressRepository
): Promise<ProgressRecord[]> {
  if (session.status !== 'completed') {
    throw new Error('Can only save progress records for completed sessions');
  }

  const exerciseIds = [...new Set(session.sets.map((s) => s.exerciseId))];
  const saved: ProgressRecord[] = [];

  for (const exerciseId of exerciseIds) {
    const exerciseSets = session.sets.filter((s) => s.exerciseId === exerciseId);

    const repsSets = exerciseSets
      .filter((s) => s.performance.type === 'reps')
      .map((s) => ({
        reps: (s.performance as any).reps as number,
        weightKg: (s.performance as any).weightKg as number,
      }));

    const totalVolumeKg = calculateTotalVolume(repsSets);

    let bestWeightKg: number | undefined;
    let bestReps: number | undefined;
    let estimatedOneRepMaxKg: number | undefined;

    if (repsSets.length > 0) {
      const bestSet = repsSets.reduce((best, s) =>
        s.weightKg > best.weightKg ? s : best
      );
      bestWeightKg = bestSet.weightKg;
      bestReps = bestSet.reps;

      if (bestSet.reps <= 36) {
        estimatedOneRepMaxKg = estimateOneRepMax({
          weightKg: bestSet.weightKg,
          reps: bestSet.reps,
        }).toKg();
      }
    }

    const record = await progressRepo.create({
      athleteId: session.athleteId,
      exerciseId,
      sessionId: session.id,
      recordedAt: session.finishedAt ?? session.startedAt,
      bestWeightKg,
      bestReps,
      estimatedOneRepMaxKg,
      totalVolumeKg,
    });

    saved.push(record);
  }

  return saved;
}
