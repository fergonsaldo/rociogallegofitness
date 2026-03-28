/**
 * Use cases for coach → athlete relationship queries.
 * All logic that a coach can perform on / about their athletes lives here.
 */

import {
  ICoachRepository,
  CoachAthlete,
  AthleteRoutineAssignment,
  AthleteCardioAssignment,
  AthleteNutritionAssignment,
  AthleteSession,
  CoachDashboardSummary,
  RecentAthleteSession,
  ClientStatus,
} from '@/domain/repositories/ICoachRepository';

export interface AthleteDetail {
  assignments: AthleteRoutineAssignment[];
  cardioAssignments: AthleteCardioAssignment[];
  nutritionAssignments: AthleteNutritionAssignment[];
  sessions: AthleteSession[];
}

const SESSION_HISTORY_LIMIT = 10;
const DASHBOARD_SESSION_LIMIT = 5;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function getCoachAthletesUseCase(
  coachId: string,
  repo: ICoachRepository,
): Promise<CoachAthlete[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getAthletes(coachId);
}

export async function getAthleteDetailUseCase(
  athleteId: string,
  repo: ICoachRepository,
): Promise<AthleteDetail> {
  if (!athleteId) throw new Error('athleteId is required');

  const [assignments, cardioAssignments, nutritionAssignments, sessions] = await Promise.all([
    repo.getAthleteAssignments(athleteId),
    repo.getAthleteCardioAssignments(athleteId),
    repo.getAthleteNutritionAssignments(athleteId),
    repo.getAthleteSessions(athleteId, SESSION_HISTORY_LIMIT),
  ]);

  return { assignments, cardioAssignments, nutritionAssignments, sessions };
}

export async function unassignRoutineFromAthleteUseCase(
  routineId: string,
  athleteId: string,
  repo: ICoachRepository,
): Promise<void> {
  if (!routineId) throw new Error('routineId is required');
  if (!athleteId) throw new Error('athleteId is required');
  return repo.unassignRoutine(routineId, athleteId);
}

export async function archiveAthleteUseCase(
  coachId: string,
  athleteId: string,
  repo: ICoachRepository,
): Promise<void> {
  if (!coachId) throw new Error('coachId is required');
  if (!athleteId) throw new Error('athleteId is required');
  return repo.updateAthleteStatus(coachId, athleteId, 'archived');
}

export async function restoreAthleteUseCase(
  coachId: string,
  athleteId: string,
  repo: ICoachRepository,
): Promise<void> {
  if (!coachId) throw new Error('coachId is required');
  if (!athleteId) throw new Error('athleteId is required');
  return repo.updateAthleteStatus(coachId, athleteId, 'active');
}

export async function getCoachDashboardSummaryUseCase(
  coachId: string,
  repo: ICoachRepository,
): Promise<CoachDashboardSummary> {
  if (!coachId) throw new Error('coachId is required');

  const since = new Date(Date.now() - WEEK_IN_MS);
  return repo.getDashboardSummary(coachId, since, DASHBOARD_SESSION_LIMIT);
}

// ── RF-E1-03: Filtro de actividad reciente ────────────────────────────────────

export type ActivityStatusFilter = 'all' | 'completed' | 'in_progress';

export function filterActivityByStatus(
  sessions: RecentAthleteSession[],
  filter:   ActivityStatusFilter,
): RecentAthleteSession[] {
  if (filter === 'all')        return sessions;
  if (filter === 'completed')  return sessions.filter((s) => s.status === 'completed');
  return sessions.filter((s) => s.status !== 'completed');
}
