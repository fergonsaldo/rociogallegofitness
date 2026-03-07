import { WorkoutSession, StartWorkoutSessionInput } from '../entities/WorkoutSession';
import { ExerciseSet, CreateExerciseSetInput } from '../entities/ExerciseSet';

/**
 * Repository contract for workout session persistence.
 * SQLite implements this for offline-first; Supabase for remote sync.
 */
export interface IWorkoutRepository {
  /** Creates and returns a new active session */
  startSession(input: StartWorkoutSessionInput): Promise<WorkoutSession>;

  /** Returns the current active session for an athlete, or null */
  getActiveSession(athleteId: string): Promise<WorkoutSession | null>;

  /** Returns a session by id with all its sets */
  getSessionById(id: string): Promise<WorkoutSession | null>;

  /** Returns all completed sessions for an athlete, newest first */
  getSessionHistory(athleteId: string, limit?: number): Promise<WorkoutSession[]>;

  /** Appends a set to an active session */
  logSet(input: CreateExerciseSetInput): Promise<ExerciseSet>;

  /** Marks the session as completed and records the finish time */
  finishSession(sessionId: string): Promise<WorkoutSession>;

  /** Marks the session as abandoned */
  abandonSession(sessionId: string): Promise<WorkoutSession>;

  /** Updates the syncedAt timestamp after a successful remote sync */
  markSynced(sessionId: string): Promise<void>;

  /** Returns sessions that have not yet been synced to the remote */
  getUnsyncedSessions(athleteId: string): Promise<WorkoutSession[]>;
}
