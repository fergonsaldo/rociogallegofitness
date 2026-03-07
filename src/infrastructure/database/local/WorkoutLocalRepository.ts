import { eq, and, desc, isNull } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { db } from '../client';
import { workoutSessions, exerciseSets } from '../schema';
import { IWorkoutRepository } from '../../../domain/repositories/IWorkoutRepository';
import { WorkoutSession, StartWorkoutSessionInput } from '../../../domain/entities/WorkoutSession';
import { ExerciseSet, CreateExerciseSetInput } from '../../../domain/entities/ExerciseSet';

/**
 * SQLite implementation — all writes go here first.
 * SyncService pushes completed sessions to Supabase when online.
 */
export class WorkoutLocalRepository implements IWorkoutRepository {

  // ── Mappers ──────────────────────────────────────────────────────────────

  private mapSession(row: typeof workoutSessions.$inferSelect, sets: ExerciseSet[] = []): WorkoutSession {
    return {
      id: row.id,
      athleteId: row.athleteId,
      routineId: row.routineId ?? undefined,
      routineDayId: row.routineDayId ?? undefined,
      status: row.status as WorkoutSession['status'],
      notes: row.notes ?? undefined,
      sets,
      startedAt: new Date(row.startedAt),
      finishedAt: row.finishedAt ? new Date(row.finishedAt) : undefined,
      syncedAt: row.syncedAt ? new Date(row.syncedAt) : undefined,
    };
  }

  private mapSet(row: typeof exerciseSets.$inferSelect): ExerciseSet {
    const performance = row.setType === 'isometric'
      ? { type: 'isometric' as const, durationSeconds: row.durationSeconds! }
      : { type: 'reps' as const, reps: row.reps!, weightKg: row.weightKg! };

    return {
      id: row.id,
      sessionId: row.sessionId,
      exerciseId: row.exerciseId,
      setNumber: row.setNumber,
      performance,
      restAfterSeconds: row.restAfterSeconds,
      completedAt: new Date(row.completedAt),
    };
  }

  // ── IWorkoutRepository ────────────────────────────────────────────────────

  async startSession(input: StartWorkoutSessionInput): Promise<WorkoutSession> {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(workoutSessions).values({
      id,
      athleteId: input.athleteId,
      routineId: input.routineId,
      routineDayId: input.routineDayId,
      notes: input.notes,
      status: 'active',
      startedAt: now,
      createdAt: now,
    });

    return this.mapSession({ id, athleteId: input.athleteId, routineId: input.routineId ?? null,
      routineDayId: input.routineDayId ?? null, notes: input.notes ?? null,
      status: 'active', startedAt: now, finishedAt: null, syncedAt: null, createdAt: now,
    });
  }

  async getActiveSession(athleteId: string): Promise<WorkoutSession | null> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.athleteId, athleteId), eq(workoutSessions.status, 'active')))
      .limit(1);

    if (!rows.length) return null;

    const sets = await this.getSetsForSession(rows[0].id);
    return this.mapSession(rows[0], sets);
  }

  async getSessionById(id: string): Promise<WorkoutSession | null> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, id))
      .limit(1);

    if (!rows.length) return null;

    const sets = await this.getSetsForSession(id);
    return this.mapSession(rows[0], sets);
  }

  async getSessionHistory(athleteId: string, limit = 20): Promise<WorkoutSession[]> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.athleteId, athleteId), eq(workoutSessions.status, 'completed')))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(limit);

    return Promise.all(rows.map(async (row) => {
      const sets = await this.getSetsForSession(row.id);
      return this.mapSession(row, sets);
    }));
  }

  async logSet(input: CreateExerciseSetInput): Promise<ExerciseSet> {
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    const isIsometric = input.performance.type === 'isometric';

    await db.insert(exerciseSets).values({
      id,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      setType: input.performance.type,
      reps: isIsometric ? null : (input.performance as any).reps,
      weightKg: isIsometric ? null : (input.performance as any).weightKg,
      durationSeconds: isIsometric ? (input.performance as any).durationSeconds : null,
      restAfterSeconds: input.restAfterSeconds,
      completedAt: now,
    });

    return {
      id,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      performance: input.performance,
      restAfterSeconds: input.restAfterSeconds,
      completedAt: new Date(now),
    };
  }

  async finishSession(sessionId: string): Promise<WorkoutSession> {
    const now = new Date().toISOString();
    await db
      .update(workoutSessions)
      .set({ status: 'completed', finishedAt: now })
      .where(eq(workoutSessions.id, sessionId));

    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found after finishing`);
    return session;
  }

  async abandonSession(sessionId: string): Promise<WorkoutSession> {
    await db
      .update(workoutSessions)
      .set({ status: 'abandoned' })
      .where(eq(workoutSessions.id, sessionId));

    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found after abandoning`);
    return session;
  }

  async markSynced(sessionId: string): Promise<void> {
    await db
      .update(workoutSessions)
      .set({ syncedAt: new Date().toISOString() })
      .where(eq(workoutSessions.id, sessionId));
  }

  async getUnsyncedSessions(athleteId: string): Promise<WorkoutSession[]> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.athleteId, athleteId),
        eq(workoutSessions.status, 'completed'),
        isNull(workoutSessions.syncedAt),
      ));

    return Promise.all(rows.map(async (row) => {
      const sets = await this.getSetsForSession(row.id);
      return this.mapSession(row, sets);
    }));
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async getSetsForSession(sessionId: string): Promise<ExerciseSet[]> {
    const rows = await db
      .select()
      .from(exerciseSets)
      .where(eq(exerciseSets.sessionId, sessionId))
      .orderBy(exerciseSets.setNumber);

    return rows.map(this.mapSet.bind(this));
  }
}
