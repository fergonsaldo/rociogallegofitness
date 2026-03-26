import { supabase } from '../client';
import { CoachSession, CreateCoachSessionInput } from '@/domain/entities/CoachSession';
import { ICoachSessionRepository } from '@/domain/repositories/ICoachSessionRepository';
import { CoachSessionRow } from '../database.types';

export class CoachSessionRemoteRepository implements ICoachSessionRepository {

  private mapRow(row: CoachSessionRow, athleteName: string | null = null): CoachSession {
    return {
      id:              row.id,
      coachId:         row.coach_id,
      athleteId:       row.athlete_id,
      athleteName,
      title:           row.title,
      sessionType:     row.session_type,
      modality:        row.modality,
      scheduledAt:     new Date(row.scheduled_at),
      durationMinutes: row.duration_minutes,
      notes:           row.notes,
      createdAt:       new Date(row.created_at),
    };
  }

  async getForMonth(coachId: string, year: number, month: number): Promise<CoachSession[]> {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end   = new Date(Date.UTC(year, month, 1));

    const { data, error } = await supabase
      .from('coach_sessions')
      .select('*, athlete:users!coach_sessions_athlete_id_fkey(full_name)')
      .eq('coach_id', coachId)
      .gte('scheduled_at', start.toISOString())
      .lt('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) =>
      this.mapRow(row as CoachSessionRow, row.athlete?.full_name ?? null),
    );
  }

  async getForRange(coachId: string, from: Date, to: Date): Promise<CoachSession[]> {
    const { data, error } = await supabase
      .from('coach_sessions')
      .select('*, athlete:users!coach_sessions_athlete_id_fkey(full_name)')
      .eq('coach_id', coachId)
      .gte('scheduled_at', from.toISOString())
      .lt('scheduled_at', to.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) =>
      this.mapRow(row as CoachSessionRow, row.athlete?.full_name ?? null),
    );
  }

  async getOverlapping(coachId: string, start: Date, end: Date): Promise<CoachSession[]> {
    // Two intervals [A,B) and [C,D) overlap iff A < D && C < B
    const { data, error } = await supabase
      .from('coach_sessions')
      .select('*')
      .eq('coach_id', coachId)
      .lt('scheduled_at', end.toISOString())
      .gt(
        'scheduled_at',
        new Date(start.getTime() - 480 * 60_000).toISOString(),
      );

    if (error) throw new Error(error.message);

    return (data ?? [])
      .map((row: CoachSessionRow) => this.mapRow(row))
      .filter((s) => {
        const sEnd = new Date(s.scheduledAt.getTime() + s.durationMinutes * 60_000);
        return s.scheduledAt < end && sEnd > start;
      });
  }

  async create(input: CreateCoachSessionInput): Promise<CoachSession> {
    const { data, error } = await supabase
      .from('coach_sessions')
      .insert({
        coach_id:         input.coachId,
        athlete_id:       input.athleteId ?? null,
        title:            input.title ?? null,
        session_type:     input.sessionType,
        modality:         input.modality,
        scheduled_at:     input.scheduledAt.toISOString(),
        duration_minutes: input.durationMinutes,
        notes:            input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after insert');
    return this.mapRow(data as CoachSessionRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coach_sessions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
