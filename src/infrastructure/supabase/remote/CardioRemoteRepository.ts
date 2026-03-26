import { supabase } from '../client';
import { ICardioRepository } from '@/domain/repositories/ICardioRepository';
import { Cardio, CatalogCardio, CreateCardioInput, CardioType, CardioIntensity } from '@/domain/entities/Cardio';

interface CardioRow {
  id:                   string;
  coach_id:             string | null;
  name:                 string;
  type:                 string;
  intensity:            string;
  duration_min_minutes: number;
  duration_max_minutes: number;
  description:          string | null;
  created_at:           string;
}

export class CardioRemoteRepository implements ICardioRepository {

  private mapRow(row: CardioRow): CatalogCardio {
    return {
      id:                 row.id,
      coachId:            row.coach_id,
      name:               row.name,
      type:               row.type as CardioType,
      intensity:          row.intensity as CardioIntensity,
      durationMinMinutes: row.duration_min_minutes,
      durationMaxMinutes: row.duration_max_minutes,
      description:        row.description ?? undefined,
      createdAt:          new Date(row.created_at),
    };
  }

  async getAll(coachId: string): Promise<CatalogCardio[]> {
    const { data, error } = await supabase
      .from('cardios')
      .select('*')
      .or(`coach_id.eq.${coachId},coach_id.is.null`)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async create(input: CreateCardioInput): Promise<Cardio> {
    const { data, error } = await supabase
      .from('cardios')
      .insert({
        coach_id:             input.coachId,
        name:                 input.name,
        type:                 input.type,
        intensity:            input.intensity,
        duration_min_minutes: input.durationMinMinutes,
        duration_max_minutes: input.durationMaxMinutes,
        description:          input.description ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after insert');
    return this.mapRow(data as CardioRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cardios')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async assignToAthlete(cardioId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('cardio_assignments')
      .insert({ cardio_id: cardioId, athlete_id: athleteId });

    if (error) throw new Error(error.message);
  }

  async unassignFromAthlete(cardioId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('cardio_assignments')
      .delete()
      .eq('cardio_id', cardioId)
      .eq('athlete_id', athleteId);

    if (error) throw new Error(error.message);
  }
}
