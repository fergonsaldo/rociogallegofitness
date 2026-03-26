import { supabase } from '../client';
import { IProgressRepository } from '@/domain/repositories/IProgressRepository';
import { ProgressRecord, CreateProgressRecordInput } from '@/domain/entities/ProgressRecord';

export class ProgressRemoteRepository implements IProgressRepository {

  private mapRow(row: any): ProgressRecord {
    return {
      id: row.id,
      athleteId: row.athlete_id,
      exerciseId: row.exercise_id,
      sessionId: row.session_id,
      recordedAt: new Date(row.recorded_at),
      bestWeightKg: row.best_weight_kg ?? undefined,
      bestReps: row.best_reps ?? undefined,
      estimatedOneRepMaxKg: row.estimated_one_rep_max_kg ?? undefined,
      totalVolumeKg: row.total_volume_kg,
    };
  }

  async create(input: CreateProgressRecordInput): Promise<ProgressRecord> {
    const { data, error } = await supabase
      .from('progress_records')
      .insert({
        athlete_id: input.athleteId,
        exercise_id: input.exerciseId,
        session_id: input.sessionId,
        recorded_at: input.recordedAt.toISOString(),
        best_weight_kg: input.bestWeightKg ?? null,
        best_reps: input.bestReps ?? null,
        estimated_one_rep_max_kg: input.estimatedOneRepMaxKg ?? null,
        total_volume_kg: input.totalVolumeKg,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after progress record insert');
    return this.mapRow(data);
  }

  async getByAthleteAndExercise(athleteId: string, exerciseId: string): Promise<ProgressRecord[]> {
    const { data, error } = await supabase
      .from('progress_records')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('exercise_id', exerciseId)
      .order('recorded_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async getLatestPerExercise(athleteId: string): Promise<ProgressRecord[]> {
    // Supabase doesn't support DISTINCT ON natively via the JS client,
    // so we fetch all records and deduplicate in memory.
    const { data, error } = await supabase
      .from('progress_records')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('recorded_at', { ascending: false });

    if (error) throw new Error(error.message);

    const seen = new Set<string>();
    return (data ?? [])
      .map(this.mapRow.bind(this))
      .filter((r) => {
        if (seen.has(r.exerciseId)) return false;
        seen.add(r.exerciseId);
        return true;
      });
  }

  async getPersonalBest(athleteId: string, exerciseId: string): Promise<ProgressRecord | null> {
    const { data, error } = await supabase
      .from('progress_records')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('exercise_id', exerciseId)
      .order('estimated_one_rep_max_kg', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? this.mapRow(data) : null;
  }
}
