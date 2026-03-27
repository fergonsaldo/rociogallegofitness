import { supabase } from '../client';
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

export class CoachRemoteRepository implements ICoachRepository {

  async getAthletes(coachId: string): Promise<CoachAthlete[]> {
    const { data, error } = await supabase
      .from('coach_athletes')
      .select('users!coach_athletes_athlete_id_fkey ( id, full_name, email )')
      .eq('coach_id', coachId);

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row: any) => row.users)
      .filter(Boolean)
      .map((u: any): CoachAthlete => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
      }));
  }

  async getAthleteAssignments(athleteId: string): Promise<AthleteRoutineAssignment[]> {
    const { data, error } = await supabase
      .from('routine_assignments')
      .select('assigned_at, routines ( id, name )')
      .eq('athlete_id', athleteId)
      .order('assigned_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row: any) => ({
        routineId:    row.routines?.id,
        routineName:  row.routines?.name,
        assignedAt:   new Date(row.assigned_at),
      }))
      .filter((r) => r.routineId);
  }

  async getAthleteCardioAssignments(athleteId: string): Promise<AthleteCardioAssignment[]> {
    const { data, error } = await supabase
      .from('cardio_assignments')
      .select('assigned_at, cardios ( id, name )')
      .eq('athlete_id', athleteId)
      .order('assigned_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row: any) => ({
        cardioId:   row.cardios?.id,
        cardioName: row.cardios?.name,
        assignedAt: new Date(row.assigned_at),
      }))
      .filter((r) => r.cardioId);
  }

  async getAthleteNutritionAssignments(athleteId: string): Promise<AthleteNutritionAssignment[]> {
    const { data, error } = await supabase
      .from('nutrition_assignments')
      .select('assigned_at, nutrition_plans ( id, name, type )')
      .eq('athlete_id', athleteId)
      .order('assigned_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row: any) => ({
        planId:    row.nutrition_plans?.id,
        planName:  row.nutrition_plans?.name,
        planType:  row.nutrition_plans?.type,
        assignedAt: new Date(row.assigned_at),
      }))
      .filter((r) => r.planId);
  }

  async getAthleteSessions(athleteId: string, limit: number): Promise<AthleteSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id, started_at, finished_at, status')
      .eq('athlete_id', athleteId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any): AthleteSession => ({
      id:         row.id,
      startedAt:  new Date(row.started_at),
      finishedAt: row.finished_at ? new Date(row.finished_at) : null,
      status:     row.status,
    }));
  }

  async unassignRoutine(routineId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('routine_assignments')
      .delete()
      .eq('routine_id', routineId)
      .eq('athlete_id', athleteId);

    if (error) throw new Error(error.message);
  }

  async updateAthleteStatus(coachId: string, athleteId: string, status: ClientStatus): Promise<void> {
    const { error } = await supabase
      .from('coach_athletes')
      .update({ status })
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId);

    if (error) throw new Error(error.message);
  }

  async getDashboardSummary(
    coachId: string,
    since: Date,
    sessionLimit: number,
  ): Promise<CoachDashboardSummary> {
    // 1. Fetch all athletes for this coach
    const { data: athleteRows, error: athleteError } = await supabase
      .from('coach_athletes')
      .select('users!coach_athletes_athlete_id_fkey ( id, full_name )')
      .eq('coach_id', coachId);

    if (athleteError) throw new Error(athleteError.message);

    const athletes = (athleteRows ?? [])
      .map((row: any) => row.users)
      .filter(Boolean)
      .map((u: any) => ({ id: u.id as string, fullName: u.full_name as string }));

    if (athletes.length === 0) {
      return { totalAthletes: 0, activeAthletesThisWeek: 0, recentSessions: [] };
    }

    const athleteIds = athletes.map((a) => a.id);
    const athleteNameById = new Map(athletes.map((a) => [a.id, a.fullName]));

    // 2. Fetch recent sessions for all athletes in one query
    const { data: sessionRows, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('id, athlete_id, started_at, status')
      .in('athlete_id', athleteIds)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(sessionLimit);

    if (sessionError) throw new Error(sessionError.message);

    const recentSessions: RecentAthleteSession[] = (sessionRows ?? []).map((row: any) => ({
      sessionId:   row.id,
      athleteId:   row.athlete_id,
      athleteName: athleteNameById.get(row.athlete_id) ?? 'Atleta',
      startedAt:   new Date(row.started_at),
      status:      row.status,
    }));

    // 3. Count athletes active since `since` (from the full recent session set)
    const { data: activeRows, error: activeError } = await supabase
      .from('workout_sessions')
      .select('athlete_id')
      .in('athlete_id', athleteIds)
      .eq('status', 'completed')
      .gte('started_at', since.toISOString());

    if (activeError) throw new Error(activeError.message);

    const activeAthleteIds = new Set((activeRows ?? []).map((r: any) => r.athlete_id));

    return {
      totalAthletes:           athletes.length,
      activeAthletesThisWeek:  activeAthleteIds.size,
      recentSessions,
    };
  }
}
