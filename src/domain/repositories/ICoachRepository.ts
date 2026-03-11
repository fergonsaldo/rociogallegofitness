/**
 * Repository contract for coach-specific queries.
 * Covers data about the coach's athletes and their activity.
 */

export interface CoachAthlete {
  id: string;
  fullName: string;
  email: string;
}

export interface AthleteRoutineAssignment {
  routineId: string;
  routineName: string;
  assignedAt: Date;
}

export interface AthleteSession {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: 'active' | 'completed' | 'abandoned';
}

export interface ICoachRepository {
  /** Returns all athletes linked to a coach */
  getAthletes(coachId: string): Promise<CoachAthlete[]>;

  /** Returns routines currently assigned to an athlete */
  getAthleteAssignments(athleteId: string): Promise<AthleteRoutineAssignment[]>;

  /** Returns the N most recent sessions for an athlete */
  getAthleteSessions(athleteId: string, limit: number): Promise<AthleteSession[]>;

  /** Removes a routine assignment for a specific athlete */
  unassignRoutine(routineId: string, athleteId: string): Promise<void>;
}
