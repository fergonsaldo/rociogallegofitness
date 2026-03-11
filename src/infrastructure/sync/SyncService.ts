import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../supabase/client';
import { WorkoutLocalRepository } from '../database/local/WorkoutLocalRepository';
import { WorkoutSession } from '@/domain/entities/WorkoutSession';
import { ExerciseSet, isRepsPerformance, isIsometricPerformance } from '@/domain/entities/ExerciseSet';

const localRepo = new WorkoutLocalRepository();

/**
 * Syncs completed, unsynced sessions from SQLite to Supabase.
 *
 * Strategy: optimistic local-first.
 *   1. All writes go to SQLite immediately (no latency, works offline).
 *   2. On session finish (or app foreground), SyncService tries to push.
 *   3. Each session is synced atomically: session header + all sets.
 *   4. On success, syncedAt is stamped locally so it's never pushed again.
 *   5. On failure the session stays unsynced — next call will retry it.
 */
export class SyncService {

  /**
   * Attempts to sync all unsynced sessions for an athlete.
   * Silently skips if offline — data is safe in SQLite.
   */
  async syncPendingSessions(athleteId: string): Promise<void> {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    const sessions = await localRepo.getUnsyncedSessions(athleteId);
    await Promise.allSettled(sessions.map((s) => this.syncSession(s)));
  }

  private async syncSession(session: WorkoutSession): Promise<void> {
    try {
      // 1 — Upsert session header (idempotent: safe to retry)
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .upsert({
          id: session.id,
          athlete_id: session.athleteId,
          routine_id: session.routineId ?? null,
          routine_day_id: session.routineDayId ?? null,
          status: session.status,
          notes: session.notes ?? null,
          started_at: session.startedAt.toISOString(),
          finished_at: session.finishedAt?.toISOString() ?? null,
        });

      if (sessionError) throw sessionError;

      // 2 — Upsert all exercise sets
      if (session.sets.length > 0) {
        const { error: setsError } = await supabase
          .from('exercise_sets')
          .upsert(session.sets.map((s: ExerciseSet) => this.mapSetToRow(s)));

        if (setsError) throw setsError;
      }

      // 3 — Mark as synced locally
      await localRepo.markSynced(session.id);

    } catch (err) {
      // Log but don't throw — other sessions should still attempt sync
      console.warn(`[SyncService] Failed to sync session ${session.id}:`, err);
    }
  }

  private mapSetToRow(set: ExerciseSet) {
    const isIsometric = set.performance.type === 'isometric';
    return {
      id: set.id,
      session_id: set.sessionId,
      exercise_id: set.exerciseId,
      set_number: set.setNumber,
      set_type: set.performance.type,
      reps: isIsometric ? null : isRepsPerformance(set.performance) ? set.performance.reps : null,
      weight_kg: isIsometric ? null : isRepsPerformance(set.performance) ? set.performance.weightKg : null,
      duration_seconds: isIsometric ? isIsometricPerformance(set.performance) ? set.performance.durationSeconds : null : null,
      rest_after_seconds: set.restAfterSeconds,
      completed_at: set.completedAt.toISOString(),
    };
  }
}

export const syncService = new SyncService();
