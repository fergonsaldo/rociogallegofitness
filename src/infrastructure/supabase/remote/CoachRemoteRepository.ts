import { supabase } from '../client';
import {
  ICoachRepository,
  CoachAthlete,
  AthleteRoutineAssignment,
  AthleteSession,
} from '@/domain/repositories/ICoachRepository';

export class CoachRemoteRepository implements ICoachRepository {

  async getAthletes(coachId: string): Promise<CoachAthlete[]> {
    const { data, error } = await supabase
      .from('coach_athletes')
      .select('users!coach_athletes_athlete_id_fkey ( id, full_name, email )')
      .eq('coach_id', coachId);

    if (error) throw error;

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

    if (error) throw error;

    return (data ?? [])
      .map((row: any) => ({
        routineId:    row.routines?.id,
        routineName:  row.routines?.name,
        assignedAt:   new Date(row.assigned_at),
      }))
      .filter((r) => r.routineId);
  }

  async getAthleteSessions(athleteId: string, limit: number): Promise<AthleteSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id, started_at, finished_at, status')
      .eq('athlete_id', athleteId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

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

    if (error) throw error;
  }
}
