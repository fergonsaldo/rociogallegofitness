import { Routine, CreateRoutineInput } from '../entities/Routine';

/**
 * Repository contract for routine persistence.
 * The domain defines this interface; infrastructure implements it.
 * Both local (SQLite) and remote (Supabase) implementations satisfy it.
 */
export interface IRoutineRepository {
  /** Returns all routines created by the given coach */
  getByCoachId(coachId: string): Promise<Routine[]>;

  /** Returns all routines assigned to the given athlete */
  getByAthleteId(athleteId: string): Promise<Routine[]>;

  /** Returns a single routine with all days and exercises */
  getById(id: string): Promise<Routine | null>;

  /** Creates a new routine and returns it with the generated id */
  create(input: CreateRoutineInput): Promise<Routine>;

  /** Replaces a routine's mutable fields */
  update(id: string, input: Partial<CreateRoutineInput>): Promise<Routine>;

  /** Returns true if the routine is currently assigned to at least one athlete */
  hasAssignments(routineId: string): Promise<boolean>;

  /** Deletes a routine and all its days/exercises (cascade) */
  delete(id: string): Promise<void>;

  /** Assigns an existing routine to an athlete */
  assignToAthlete(routineId: string, athleteId: string): Promise<void>;

  /** Removes an assignment between a routine and an athlete */
  unassignFromAthlete(routineId: string, athleteId: string): Promise<void>;
}
