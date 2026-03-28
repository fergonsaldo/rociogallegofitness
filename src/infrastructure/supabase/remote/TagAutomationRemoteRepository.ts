import { supabase } from '../client';
import { TagAutomation, SaveTagAutomationInput } from '@/domain/entities/TagAutomation';
import { ITagAutomationRepository } from '@/domain/repositories/ITagAutomationRepository';
import { TagAutomationRow } from '../database.types';

export class TagAutomationRemoteRepository implements ITagAutomationRepository {

  private mapRow(row: TagAutomationRow): TagAutomation {
    return {
      id:              row.id,
      tagId:           row.tag_id,
      routineId:       row.routine_id,
      cardioId:        row.cardio_id,
      nutritionPlanId: row.nutrition_plan_id,
      createdAt:       new Date(row.created_at),
    };
  }

  async getByTagId(tagId: string): Promise<TagAutomation | null> {
    const { data, error } = await supabase
      .from('tag_automations')
      .select('*')
      .eq('tag_id', tagId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return this.mapRow(data as TagAutomationRow);
  }

  async save(tagId: string, input: SaveTagAutomationInput): Promise<TagAutomation> {
    const { data, error } = await supabase
      .from('tag_automations')
      .upsert(
        {
          tag_id:            tagId,
          routine_id:        input.routineId        ?? null,
          cardio_id:         input.cardioId         ?? null,
          nutrition_plan_id: input.nutritionPlanId  ?? null,
        },
        { onConflict: 'tag_id' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after upsert');
    return this.mapRow(data as TagAutomationRow);
  }

  async delete(tagId: string): Promise<void> {
    const { error } = await supabase
      .from('tag_automations')
      .delete()
      .eq('tag_id', tagId);

    if (error) throw new Error(error.message);
  }
}
