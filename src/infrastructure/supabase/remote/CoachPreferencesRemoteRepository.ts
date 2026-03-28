import { supabase } from '../client';
import { ICoachPreferencesRepository } from '@/domain/repositories/ICoachPreferencesRepository';
import { CoachPreferencesRow, CoachPreferencesUpsert } from '../database.types';

export class CoachPreferencesRemoteRepository implements ICoachPreferencesRepository {

  async getQuickAccess(coachId: string): Promise<string[] | null> {
    const { data, error } = await supabase
      .from('coach_preferences')
      .select('quick_access')
      .eq('coach_id', coachId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as Pick<CoachPreferencesRow, 'quick_access'> | null)?.quick_access ?? null;
  }

  async upsertQuickAccess(coachId: string, keys: string[]): Promise<void> {
    const row: CoachPreferencesUpsert = { coach_id: coachId, quick_access: keys };

    const { error } = await supabase
      .from('coach_preferences')
      .upsert(row, { onConflict: 'coach_id' });

    if (error) throw new Error(error.message);
  }
}
