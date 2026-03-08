import { supabase } from '../client';
import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';
import { Routine, CreateRoutineInput, RoutineDay, RoutineExercise } from '@/domain/entities/Routine';

/**
 * Supabase implementation of IRoutineRepository.
 * Fetches routines with their nested days and exercises in a single query
 * using Supabase's relational select syntax.
 */
export class RoutineRemoteRepository implements IRoutineRepository {

  private mapRow(row: any): Routine {
    return {
      id: row.id,
      coachId: row.coach_id,
      name: row.name,
      description: row.description ?? undefined,
      durationWeeks: row.duration_weeks ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      days: (row.routine_days ?? [])
        .sort((a: any, b: any) => a.day_number - b.day_number)
        .map((day: any): RoutineDay => ({
          id: day.id,
          routineId: day.routine_id,
          dayNumber: day.day_number,
          name: day.name,
          exercises: (day.routine_exercises ?? [])
            .sort((a: any, b: any) => a.order - b.order)
            .map((ex: any): RoutineExercise => ({
              id: ex.id,
              routineDayId: ex.routine_day_id,
              exerciseId: ex.exercise_id,
              order: ex.order,
              targetSets: ex.target_sets,
              targetReps: ex.target_reps ?? undefined,
              targetDurationSeconds: ex.target_duration_seconds ?? undefined,
              restBetweenSetsSeconds: ex.rest_between_sets_seconds,
              notes: ex.notes ?? undefined,
            })),
        })),
    };
  }

  private readonly SELECT = `
    *,
    routine_days (
      *,
      routine_exercises ( * )
    )
  `;

  async getByCoachId(coachId: string): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select(this.SELECT)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async getByAthleteId(athleteId: string): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routine_assignments')
      .select(`routines ( ${this.SELECT} )`)
      .eq('athlete_id', athleteId);

    if (error) throw error;
    return (data ?? [])
      .map((row: any) => row.routines)
      .filter(Boolean)
      .map(this.mapRow.bind(this));
  }

  async getById(id: string): Promise<Routine | null> {
    const { data, error } = await supabase
      .from('routines')
      .select(this.SELECT)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw error;
    }
    return this.mapRow(data);
  }

  async create(input: CreateRoutineInput): Promise<Routine> {
    // 1 — Insert routine header
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        coach_id: input.coachId,
        name: input.name,
        description: input.description,
        duration_weeks: input.durationWeeks,
      })
      .select()
      .single();

    if (routineError || !routine) throw routineError;

    // 2 — Insert days + exercises
    for (const day of input.days) {
      const { data: createdDay, error: dayError } = await supabase
        .from('routine_days')
        .insert({
          routine_id: routine.id,
          day_number: day.dayNumber,
          name: day.name,
        })
        .select()
        .single();

      if (dayError || !createdDay) throw dayError;

      if (day.exercises.length > 0) {
        const { error: exError } = await supabase
          .from('routine_exercises')
          .insert(
            day.exercises.map((ex) => ({
              routine_day_id: createdDay.id,
              exercise_id: ex.exerciseId,
              order: ex.order,
              target_sets: ex.targetSets,
              target_reps: ex.targetReps,
              target_duration_seconds: ex.targetDurationSeconds,
              rest_between_sets_seconds: ex.restBetweenSetsSeconds,
              notes: ex.notes,
            }))
          );

        if (exError) throw exError;
      }
    }

    // 3 — Re-fetch with full nested structure
    const created = await this.getById(routine.id);
    if (!created) throw new Error('Routine not found after creation');
    return created;
  }

  async update(id: string, input: Partial<CreateRoutineInput>): Promise<Routine> {
    const { error } = await supabase
      .from('routines')
      .update({
        name: input.name,
        description: input.description,
        duration_weeks: input.durationWeeks,
      })
      .eq('id', id);

    if (error) throw error;

    const updated = await this.getById(id);
    if (!updated) throw new Error('Routine not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async assignToAthlete(routineId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('routine_assignments')
      .upsert({ routine_id: routineId, athlete_id: athleteId });

    if (error) throw error;
  }

  async unassignFromAthlete(routineId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('routine_assignments')
      .delete()
      .eq('routine_id', routineId)
      .eq('athlete_id', athleteId);

    if (error) throw error;
  }
}
