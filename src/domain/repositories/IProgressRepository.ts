import { ProgressRecord, CreateProgressRecordInput } from '../entities/ProgressRecord';

/**
 * Repository contract for progress record persistence.
 * ProgressRecords are derived from completed WorkoutSessions
 * and stored for fast chart queries — they are never edited manually.
 */
export interface IProgressRepository {
  /** Creates a single progress record (called after finishSession) */
  create(input: CreateProgressRecordInput): Promise<ProgressRecord>;

  /** Returns all records for an athlete × exercise pair, sorted oldest→newest */
  getByAthleteAndExercise(athleteId: string, exerciseId: string): Promise<ProgressRecord[]>;

  /** Returns one record per exercise, the most recent one (for dashboard snapshot) */
  getLatestPerExercise(athleteId: string): Promise<ProgressRecord[]>;

  /** Returns the personal best (highest estimated 1RM) for a specific exercise */
  getPersonalBest(athleteId: string, exerciseId: string): Promise<ProgressRecord | null>;
}
