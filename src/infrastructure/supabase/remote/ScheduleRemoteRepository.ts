import { supabase } from '../client';
import { Schedule, CreateScheduleInput } from '@/domain/entities/Schedule';
import { IScheduleRepository } from '@/domain/repositories/IScheduleRepository';
import { ScheduleRow, ScheduleInsert } from '../database.types';

export class ScheduleRemoteRepository implements IScheduleRepository {

  private mapRow(row: ScheduleRow): Schedule {
    return {
      id:                   row.id,
      coachId:              row.coach_id,
      title:                row.title,
      startDate:            new Date(row.start_date),
      endDate:              new Date(row.end_date),
      startTime:            row.start_time,
      endTime:              row.end_time,
      slotDurationMinutes:  row.slot_duration_minutes,
      modality:             row.modality,
      isActive:             row.is_active,
      createdAt:            new Date(row.created_at),
    };
  }

  async getByCoachId(coachId: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('coach_id', coachId)
      .order('start_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: ScheduleRow) => this.mapRow(row));
  }

  async create(input: CreateScheduleInput): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        coach_id:             input.coachId,
        title:                input.title,
        start_date:           input.startDate.toISOString().split('T')[0],
        end_date:             input.endDate.toISOString().split('T')[0],
        start_time:           input.startTime,
        end_time:             input.endTime,
        slot_duration_minutes: input.slotDurationMinutes,
        modality:             input.modality,
        is_active:            input.isActive,
      } as ScheduleInsert)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after insert');
    return this.mapRow(data as ScheduleRow);
  }

  async toggleActive(id: string, isActive: boolean): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after update');
    return this.mapRow(data as ScheduleRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
