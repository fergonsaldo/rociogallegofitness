import { supabase } from '../client';
import { ICustomExerciseRepository } from '@/domain/repositories/ICustomExerciseRepository';
import { CustomExercise, CreateCustomExerciseInput } from '@/domain/entities/CustomExercise';
import { CoachExerciseRow } from '../database.types';

export class CustomExerciseRemoteRepository implements ICustomExerciseRepository {

  private mapRow(row: CoachExerciseRow): CustomExercise {
    return {
      id:               row.id,
      coachId:          row.coach_id,
      name:             row.name,
      category:         row.category,
      primaryMuscles:   row.primary_muscles as CustomExercise['primaryMuscles'],
      secondaryMuscles: row.secondary_muscles as CustomExercise['secondaryMuscles'],
      isIsometric:      row.is_isometric,
      description:      row.description ?? undefined,
      videoUrl:         row.video_url ?? undefined,
      createdAt:        new Date(row.created_at),
    };
  }

  async getByCoachId(coachId: string): Promise<CustomExercise[]> {
    const { data, error } = await supabase
      .from('coach_exercises')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async create(input: CreateCustomExerciseInput): Promise<CustomExercise> {
    const { data, error } = await supabase
      .from('coach_exercises')
      .insert({
        coach_id:          input.coachId,
        name:              input.name,
        category:          input.category,
        primary_muscles:   input.primaryMuscles,
        secondary_muscles: input.secondaryMuscles,
        is_isometric:      input.isIsometric,
        description:       input.description ?? null,
        video_url:         input.videoUrl ?? null,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error('No data returned after insert');
    return this.mapRow(data as CoachExerciseRow);
  }
}
