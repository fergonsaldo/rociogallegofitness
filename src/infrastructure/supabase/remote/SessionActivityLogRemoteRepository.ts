import { supabase } from '../client';
import {
  SessionActivityLog,
  CreateSessionActivityLogInput,
} from '@/domain/entities/SessionActivityLog';
import { ISessionActivityLogRepository } from '@/domain/repositories/ISessionActivityLogRepository';
import { SessionActivityLogRow, SessionActivityLogInsert } from '../database.types';

export class SessionActivityLogRemoteRepository implements ISessionActivityLogRepository {

  private mapRow(row: SessionActivityLogRow): SessionActivityLog {
    return {
      id:          row.id,
      coachId:     row.coach_id,
      sessionId:   row.session_id,
      action:      row.action,
      title:       row.title,
      sessionType: row.session_type,
      modality:    row.modality as 'online' | 'in_person' | null,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : null,
      loggedAt:    new Date(row.logged_at),
    };
  }

  async getByCoachId(coachId: string, from: Date, to: Date): Promise<SessionActivityLog[]> {
    const { data, error } = await supabase
      .from('session_activity_log')
      .select('*')
      .eq('coach_id', coachId)
      .gte('logged_at', from.toISOString())
      .lte('logged_at', to.toISOString())
      .order('logged_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: SessionActivityLogRow) => this.mapRow(row));
  }

  async create(input: CreateSessionActivityLogInput): Promise<void> {
    const insert: SessionActivityLogInsert = {
      coach_id:     input.coachId,
      session_id:   input.sessionId,
      action:       input.action,
      title:        input.title,
      session_type: input.sessionType,
      modality:     input.modality,
      scheduled_at: input.scheduledAt.toISOString(),
    };

    const { error } = await supabase
      .from('session_activity_log')
      .insert(insert);

    if (error) throw new Error(error.message);
  }
}
