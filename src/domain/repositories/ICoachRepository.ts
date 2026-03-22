/**
 * Repository contract for coach-specific queries.
 * Covers data about the coach's athletes and their activity.
 */

export type ClientStatus = 'active' | 'archived';

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

export interface RecentAthleteSession {
  sessionId: string;
  athleteId: string;
  athleteName: string;
  startedAt: Date;
  status: 'active' | 'completed' | 'abandoned';
}

export interface CoachDashboardSummary {
  totalAthletes: number;
  activeAthletesThisWeek: number;
  recentSessions: RecentAthleteSession[];
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

  /**
   * Returns a summary for the coach dashboard:
   * total athletes, how many trained since `since`, and the last `sessionLimit` sessions.
   */
  getDashboardSummary(
    coachId: string,
    since: Date,
    sessionLimit: number,
  ): Promise<CoachDashboardSummary>;

  /** Updates the status of an athlete relationship (active / archived) */
  updateAthleteStatus(coachId: string, athleteId: string, status: ClientStatus): Promise<void>;
}
