import { z } from 'zod';
import { WorkoutSession } from '../../domain/entities/WorkoutSession';
import { ExerciseSet } from '../../domain/entities/ExerciseSet';
import { IWorkoutRepository } from '../../domain/repositories/IWorkoutRepository';
import { calculateTotalVolume } from '../../domain/value-objects/Volume';
import { estimateOneRepMax } from '../../domain/value-objects/OneRepMax';

// ── StartWorkoutSession ───────────────────────────────────────────────────────

export const StartSessionInputSchema = z.object({
  athleteId: z.string().uuid(),
  routineId: z.string().uuid().optional(),
  routineDayId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export type StartSessionInput = z.infer<typeof StartSessionInputSchema>;

/**
 * Starts a new workout session.
 * Throws if the athlete already has an active session — they must finish
 * or abandon the previous one first.
 */
export async function startWorkoutSessionUseCase(
  input: StartSessionInput,
  repository: IWorkoutRepository
): Promise<WorkoutSession> {
  StartSessionInputSchema.parse(input);

  const existing = await repository.getActiveSession(input.athleteId);
  if (existing) {
    throw new Error('You already have an active workout session. Finish or abandon it first.');
  }

  return repository.startSession(input);
}

// ── LogExerciseSet ────────────────────────────────────────────────────────────

export const LogSetInputSchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  performance: z.discriminatedUnion('type', [
    z.object({ type: z.literal('reps'), reps: z.number().int().min(1).max(999), weightKg: z.number().min(0).max(500) }),
    z.object({ type: z.literal('isometric'), durationSeconds: z.number().int().min(1).max(3600) }),
  ]),
  restAfterSeconds: z.number().int().min(0).max(3600).default(0),
});

export type LogSetInput = z.infer<typeof LogSetInputSchema>;

/**
 * Logs a single exercise set to an active session.
 * Automatically computes the set number by counting existing sets for that exercise.
 */
export async function logExerciseSetUseCase(
  input: LogSetInput,
  repository: IWorkoutRepository
): Promise<ExerciseSet> {
  LogSetInputSchema.parse(input);

  const session = await repository.getSessionById(input.sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Cannot log sets to a session that is not active');

  // Compute set number for this exercise within the session
  const existingSets = session.sets.filter((s) => s.exerciseId === input.exerciseId);
  const setNumber = existingSets.length + 1;

  return repository.logSet({ ...input, setNumber });
}

// ── FinishWorkoutSession ──────────────────────────────────────────────────────

export interface SessionSummary {
  session: WorkoutSession;
  totalVolumeKg: number;
  totalSets: number;
  durationMinutes: number;
  exerciseSummaries: Array<{
    exerciseId: string;
    sets: number;
    estimatedOneRepMaxKg?: number;
  }>;
}

/**
 * Finalises a session, computes a summary and triggers background sync.
 */
export async function finishWorkoutSessionUseCase(
  sessionId: string,
  repository: IWorkoutRepository
): Promise<SessionSummary> {
  if (!sessionId) throw new Error('sessionId is required');

  const session = await repository.getSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Session is not active');

  const finished = await repository.finishSession(sessionId);

  // Compute summary metrics
  const repsSets = finished.sets
    .filter((s) => s.performance.type === 'reps')
    .map((s) => ({
      reps: (s.performance as any).reps,
      weightKg: (s.performance as any).weightKg,
    }));

  const totalVolumeKg = calculateTotalVolume(repsSets);
  const durationMinutes = finished.finishedAt
    ? Math.round((finished.finishedAt.getTime() - finished.startedAt.getTime()) / 60000)
    : 0;

  // Per-exercise summaries with 1RM estimates
  const exerciseIds = [...new Set(finished.sets.map((s) => s.exerciseId))];
  const exerciseSummaries = exerciseIds.map((exerciseId) => {
    const exerciseSets = finished.sets.filter((s) => s.exerciseId === exerciseId);
    const repsSetsForExercise = exerciseSets
      .filter((s) => s.performance.type === 'reps')
      .map((s) => ({
        reps: (s.performance as any).reps as number,
        weightKg: (s.performance as any).weightKg as number,
      }));

    let estimatedOneRepMaxKg: number | undefined;
    if (repsSetsForExercise.length > 0) {
      const best = repsSetsForExercise.reduce((max, s) =>
        s.weightKg > max.weightKg ? s : max
      );
      if (best.reps <= 36) {
        estimatedOneRepMaxKg = estimateOneRepMax({
          weightKg: best.weightKg,
          reps: best.reps,
        }).toKg();
      }
    }

    return { exerciseId, sets: exerciseSets.length, estimatedOneRepMaxKg };
  });

  return { session: finished, totalVolumeKg, totalSets: finished.sets.length, durationMinutes, exerciseSummaries };
}

// ── AbandonWorkoutSession ─────────────────────────────────────────────────────

/**
 * Abandons an active session. Sets are kept for reference but
 * the session is not included in progress history.
 */
export async function abandonWorkoutSessionUseCase(
  sessionId: string,
  repository: IWorkoutRepository
): Promise<void> {
  if (!sessionId) throw new Error('sessionId is required');
  const session = await repository.getSessionById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Session is not active');
  await repository.abandonSession(sessionId);
}
