import { supabase } from '../client';
import { INutritionRepository } from '@/domain/repositories/INutritionRepository';
import {
  NutritionPlan, CreateNutritionPlanInput,
  MealLogEntry, CreateMealLogEntryInput, Macros, PlanType,
} from '@/domain/entities/NutritionPlan';

export class NutritionRemoteRepository implements INutritionRepository {

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapMacros(row: any): Macros {
    return {
      calories: row.calories,
      proteinG: row.protein_g,
      carbsG: row.carbs_g,
      fatG: row.fat_g,
    };
  }

  private mapPlan(row: any): NutritionPlan {
    return {
      id: row.id,
      coachId: row.coach_id,
      name: row.name,
      type: (row.type ?? 'other') as PlanType,
      description: row.description ?? undefined,
      dailyTargetMacros: this.mapMacros(row),
      meals: (row.meals ?? [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((m: any) => ({
          id: m.id,
          nutritionPlanId: m.nutrition_plan_id,
          name: m.name,
          order: m.order,
          targetMacros: this.mapMacros(m),
          notes: m.notes ?? undefined,
          linkedRecipes: (m.meal_recipes ?? [])
            .map((mr: any) => ({ id: mr.recipes?.id ?? mr.recipe_id, name: mr.recipes?.name ?? '' }))
            .filter((lr: any) => lr.id),
        })),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapLogEntry(row: any): MealLogEntry {
    return {
      id: row.id,
      mealId: row.meal_id,
      athleteId: row.athlete_id,
      loggedAt: new Date(row.logged_at),
      actualMacros: this.mapMacros(row),
      notes: row.notes ?? undefined,
    };
  }

  private readonly PLAN_SELECT = `
    *,
    meals (
      *,
      meal_recipes ( recipe_id, recipes ( id, name ) )
    )
  `;

  // ── Plan CRUD ─────────────────────────────────────────────────────────────

  async createPlan(input: CreateNutritionPlanInput): Promise<NutritionPlan> {
    const { data: plan, error } = await supabase
      .from('nutrition_plans')
      .insert({
        coach_id:    input.coachId,
        name:        input.name,
        type:        input.type,
        description: input.description ?? null,
        calories:    input.dailyTargetMacros.calories,
        protein_g:   input.dailyTargetMacros.proteinG,
        carbs_g:     input.dailyTargetMacros.carbsG,
        fat_g:       input.dailyTargetMacros.fatG,
      })
      .select()
      .single();

    if (error) throw new Error(`nutrition_plans insert: ${error.message} (${error.code})`);
    if (!plan) throw new Error('nutrition_plans insert returned no data');

    // Insert meals
    const { error: mealsError } = await supabase
      .from('meals')
      .insert(
        input.meals.map((m) => ({
          nutrition_plan_id: plan.id,
          name: m.name,
          order: m.order,
          calories: m.targetMacros.calories,
          protein_g: m.targetMacros.proteinG,
          carbs_g: m.targetMacros.carbsG,
          fat_g: m.targetMacros.fatG,
          notes: m.notes,
        }))
      );

    if (mealsError) throw new Error(`meals insert: ${mealsError.message} (${mealsError.code})`);

    const created = await this.getPlanById(plan.id);
    if (!created) throw new Error('Plan not found after creation');
    return created;
  }

  async getPlansByCoach(coachId: string): Promise<NutritionPlan[]> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select(this.PLAN_SELECT)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapPlan.bind(this));
  }

  async getPlanById(id: string): Promise<NutritionPlan | null> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select(this.PLAN_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return this.mapPlan(data);
  }

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase.from('nutrition_plans').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ── Assignments ───────────────────────────────────────────────────────────

  async assignToAthlete(planId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('nutrition_assignments')
      .upsert(
        { nutrition_plan_id: planId, athlete_id: athleteId },
        { onConflict: 'nutrition_plan_id,athlete_id' },
      );
    if (error) throw new Error(error.message);
  }

  async unassignFromAthlete(planId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('nutrition_assignments')
      .delete()
      .eq('nutrition_plan_id', planId)
      .eq('athlete_id', athleteId);
    if (error) throw new Error(error.message);
  }

  // ── Meal recipes ──────────────────────────────────────────────────────────

  async linkRecipeToMeal(mealId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('meal_recipes')
      .insert({ meal_id: mealId, recipe_id: recipeId });
    if (error) throw new Error(error.message);
  }

  async unlinkRecipeFromMeal(mealId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('meal_recipes')
      .delete()
      .eq('meal_id', mealId)
      .eq('recipe_id', recipeId);
    if (error) throw new Error(error.message);
  }

  async getAssignedPlan(athleteId: string): Promise<NutritionPlan | null> {
    const { data, error } = await supabase
      .from('nutrition_assignments')
      .select(`nutrition_plans ( ${this.PLAN_SELECT} )`)
      .eq('athlete_id', athleteId)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.nutrition_plans) return null;
    return this.mapPlan(data.nutrition_plans);
  }

  // ── Meal log ──────────────────────────────────────────────────────────────

  async logMeal(input: CreateMealLogEntryInput): Promise<MealLogEntry> {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        meal_id: input.mealId,
        athlete_id: input.athleteId,
        logged_at: new Date().toISOString(),
        calories: input.actualMacros.calories,
        protein_g: input.actualMacros.proteinG,
        carbs_g: input.actualMacros.carbsG,
        fat_g: input.actualMacros.fatG,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after logMeal insert');
    return this.mapLogEntry(data);
  }

  async getLogEntriesForDay(athleteId: string, date: Date): Promise<MealLogEntry[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapLogEntry.bind(this));
  }

  async getLogEntriesForRange(athleteId: string, from: Date, to: Date): Promise<MealLogEntry[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('logged_at', from.toISOString())
      .lte('logged_at', to.toISOString())
      .order('logged_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapLogEntry.bind(this));
  }
}
