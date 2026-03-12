import { supabase } from '../client';
import { IBodyMetricRepository } from '@/domain/repositories/IBodyMetricRepository';
import { BodyMetric, CreateBodyMetricInput } from '@/domain/entities/BodyMetric';
import { BodyMetricRow } from '../database.types';

export class BodyMetricRemoteRepository implements IBodyMetricRepository {

  private mapRow(row: BodyMetricRow): BodyMetric {
    return {
      id:              row.id,
      athleteId:       row.athlete_id,
      recordedAt:      new Date(row.recorded_at),
      weightKg:        row.weight_kg        ?? undefined,
      waistCm:         row.waist_cm         ?? undefined,
      hipCm:           row.hip_cm           ?? undefined,
      bodyFatPercent:  row.body_fat_percent  ?? undefined,
      notes:           row.notes            ?? undefined,
      createdAt:       new Date(row.created_at),
    };
  }

  async getByAthleteId(athleteId: string): Promise<BodyMetric[]> {
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('recorded_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async create(input: CreateBodyMetricInput): Promise<BodyMetric> {
    const { data, error } = await supabase
      .from('body_metrics')
      .insert({
        athlete_id:       input.athleteId,
        recorded_at:      input.recordedAt.toISOString(),
        weight_kg:        input.weightKg       ?? null,
        waist_cm:         input.waistCm        ?? null,
        hip_cm:           input.hipCm          ?? null,
        body_fat_percent: input.bodyFatPercent ?? null,
        notes:            input.notes          ?? null,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error('No data returned after insert');
    return this.mapRow(data as BodyMetricRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('body_metrics')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
