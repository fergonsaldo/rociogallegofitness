import { supabase } from '../client';
import { ICustomExerciseRepository, UpdateCustomExerciseInput } from '@/domain/repositories/ICustomExerciseRepository';
import { CustomExercise, CreateCustomExerciseInput } from '@/domain/entities/CustomExercise';

// exercises row shape (unified catalog)
interface ExerciseRow {
  id:                string;
  coach_id:          string | null;
  name:              string;
  category:          string;
  primary_muscles:   string[];
  secondary_muscles: string[];
  is_isometric:      boolean;
  description:       string | null;
  video_url:         string | null;
  created_at:        string;
}

export class CustomExerciseRemoteRepository implements ICustomExerciseRepository {

  private mapRow(row: ExerciseRow): CustomExercise {
    return {
      id:               row.id,
      coachId:          row.coach_id ?? '',
      name:             row.name,
      category:         row.category as CustomExercise['category'],
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
      .from('exercises')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async create(input: CreateCustomExerciseInput): Promise<CustomExercise> {
    const { data, error } = await supabase
      .from('exercises')
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

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after insert');
    return this.mapRow(data as ExerciseRow);
  }

  async update(id: string, input: UpdateCustomExerciseInput): Promise<CustomExercise> {
    const patch: Partial<ExerciseRow> = {};
    if (input.name             !== undefined) patch.name              = input.name;
    if (input.category         !== undefined) patch.category          = input.category;
    if (input.primaryMuscles   !== undefined) patch.primary_muscles   = input.primaryMuscles;
    if (input.secondaryMuscles !== undefined) patch.secondary_muscles = input.secondaryMuscles;
    if (input.isIsometric      !== undefined) patch.is_isometric      = input.isIsometric;
    if (input.description      !== undefined) patch.description       = input.description ?? null;
    if (input.videoUrl         !== undefined) patch.video_url         = input.videoUrl ?? null;

    const { data, error } = await supabase
      .from('exercises')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after update');
    return this.mapRow(data as ExerciseRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async isInUse(exerciseId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('routine_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('exercise_id', exerciseId);

    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
}
