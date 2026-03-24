import { supabase } from '../client';
import { IFoodRepository } from '@/domain/repositories/IFoodRepository';
import { Food, CreateFoodInput, FoodType } from '@/domain/entities/Food';

export class FoodRemoteRepository implements IFoodRepository {

  private mapFood(row: any): Food {
    return {
      id:              row.id,
      coachId:         row.coach_id ?? null,
      name:            row.name,
      type:            row.type as FoodType,
      caloriesPer100g: Number(row.calories_per_100g),
      proteinG:        Number(row.protein_g),
      carbsG:          Number(row.carbs_g),
      fatG:            Number(row.fat_g),
      fiberG:          Number(row.fiber_g),
      createdAt:       new Date(row.created_at),
    };
  }

  async getFoodsByCoach(coachId: string): Promise<Food[]> {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .or(`coach_id.eq.${coachId},coach_id.is.null`)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(this.mapFood.bind(this));
  }

  async createFood(input: CreateFoodInput): Promise<Food> {
    const { data, error } = await supabase
      .from('foods')
      .insert({
        coach_id:          input.coachId,
        name:              input.name,
        type:              input.type,
        calories_per_100g: input.caloriesPer100g,
        protein_g:         input.proteinG,
        carbs_g:           input.carbsG,
        fat_g:             input.fatG,
        fiber_g:           input.fiberG,
      })
      .select()
      .single();

    if (error || !data) throw error;
    return this.mapFood(data);
  }

  async deleteFood(id: string): Promise<void> {
    const { error } = await supabase.from('foods').delete().eq('id', id);
    if (error) throw error;
  }
}
