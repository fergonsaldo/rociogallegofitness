import { supabase } from '../client';
import { INutritionRepository } from '@/domain/repositories/INutritionRepository';
import {
  NutritionPlan, CreateNutritionPlanInput,
  MealLogEntry, CreateMealLogEntryInput, Macros, PlanType,
  PlanGroup, CreatePlanGroupInput,
  PlanVersion, UpdatePlanMetaInput,
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

  // ── Plan versions ─────────────────────────────────────────────────────────

  private mapVersion(row: any): PlanVersion {
    return {
      id:      row.id,
      planId:  row.plan_id,
      savedAt: new Date(row.saved_at),
      savedBy: row.saved_by,
      name:    row.name,
      type:    (row.type ?? 'other') as PlanType,
      description: row.description ?? undefined,
      dailyTargetMacros: this.mapMacros(row),
    };
  }

  async updatePlanMeta(planId: string, input: UpdatePlanMetaInput): Promise<NutritionPlan> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name        !== undefined) payload.name        = input.name;
    if (input.type        !== undefined) payload.type        = input.type;
    if (input.description !== undefined) payload.description = input.description;
    if (input.dailyTargetMacros) {
      payload.calories  = input.dailyTargetMacros.calories;
      payload.protein_g = input.dailyTargetMacros.proteinG;
      payload.carbs_g   = input.dailyTargetMacros.carbsG;
      payload.fat_g     = input.dailyTargetMacros.fatG;
    }

    const { error } = await supabase
      .from('nutrition_plans')
      .update(payload)
      .eq('id', planId);

    if (error) throw new Error(error.message);

    const updated = await this.getPlanById(planId);
    if (!updated) throw new Error('Plan not found after update');
    return updated;
  }

  async savePlanVersion(planId: string, coachId: string): Promise<void> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const { error } = await supabase.from('plan_versions').insert({
      plan_id:     planId,
      saved_by:    coachId,
      name:        plan.name,
      type:        plan.type,
      description: plan.description ?? null,
      calories:    plan.dailyTargetMacros.calories,
      protein_g:   plan.dailyTargetMacros.proteinG,
      carbs_g:     plan.dailyTargetMacros.carbsG,
      fat_g:       plan.dailyTargetMacros.fatG,
    });
    if (error) throw new Error(error.message);

    // Mantener máximo 20 versiones por plan (eliminar las más antiguas)
    const { data: versions } = await supabase
      .from('plan_versions')
      .select('id, saved_at')
      .eq('plan_id', planId)
      .order('saved_at', { ascending: false });

    if (versions && versions.length > 20) {
      const toDelete = versions.slice(20).map((v: any) => v.id);
      await supabase.from('plan_versions').delete().in('id', toDelete);
    }
  }

  async getPlanVersions(planId: string): Promise<PlanVersion[]> {
    const { data, error } = await supabase
      .from('plan_versions')
      .select('*')
      .eq('plan_id', planId)
      .order('saved_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(this.mapVersion.bind(this));
  }

  async restorePlanVersion(versionId: string, planId: string, coachId: string): Promise<NutritionPlan> {
    const { data: version, error: vErr } = await supabase
      .from('plan_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (vErr || !version) throw new Error('Version not found');

    return this.updatePlanMeta(planId, {
      name:        version.name,
      type:        version.type,
      description: version.description ?? null,
      dailyTargetMacros: {
        calories:  version.calories,
        proteinG:  Number(version.protein_g),
        carbsG:    Number(version.carbs_g),
        fatG:      Number(version.fat_g),
      },
    });
  }

  // ── Plan groups ───────────────────────────────────────────────────────────

  private mapGroup(row: any): PlanGroup {
    return {
      id:          row.id,
      coachId:     row.coach_id,
      name:        row.name,
      description: row.description ?? undefined,
      planCount:   row.plan_count ?? 0,
      createdAt:   new Date(row.created_at),
    };
  }

  async createPlanGroup(input: CreatePlanGroupInput): Promise<PlanGroup> {
    const { data, error } = await supabase
      .from('plan_groups')
      .insert({
        coach_id:    input.coachId,
        name:        input.name,
        description: input.description ?? null,
      })
      .select('*, plan_group_plans(count)')
      .single();

    if (error) throw new Error(`plan_groups insert: ${error.message} (${error.code})`);
    if (!data) throw new Error('plan_groups insert returned no data');
    return this.mapGroup({ ...data, plan_count: 0 });
  }

  async deletePlanGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('plan_groups').delete().eq('id', groupId);
    if (error) throw new Error(error.message);
  }

  async getPlanGroups(coachId: string): Promise<PlanGroup[]> {
    const { data, error } = await supabase
      .from('plan_groups')
      .select('*, plan_group_plans(count)')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) =>
      this.mapGroup({ ...row, plan_count: row.plan_group_plans?.[0]?.count ?? 0 })
    );
  }

  async getPlanGroupDetail(groupId: string): Promise<{ group: PlanGroup; plans: NutritionPlan[] }> {
    const [groupRes, plansRes] = await Promise.all([
      supabase
        .from('plan_groups')
        .select('*, plan_group_plans(count)')
        .eq('id', groupId)
        .single(),
      supabase
        .from('plan_group_plans')
        .select(`nutrition_plans ( ${this.PLAN_SELECT} )`)
        .eq('group_id', groupId)
        .order('added_at', { ascending: true }),
    ]);

    if (groupRes.error) {
      if (groupRes.error.code === 'PGRST116') throw new Error('Group not found');
      throw new Error(groupRes.error.message);
    }
    if (plansRes.error) throw new Error(plansRes.error.message);

    const group = this.mapGroup({
      ...groupRes.data,
      plan_count: groupRes.data.plan_group_plans?.[0]?.count ?? 0,
    });

    const plans = (plansRes.data ?? [])
      .map((row: any) => row.nutrition_plans)
      .filter(Boolean)
      .map(this.mapPlan.bind(this));

    return { group, plans };
  }

  async addPlanToGroup(groupId: string, planId: string): Promise<void> {
    const { error } = await supabase
      .from('plan_group_plans')
      .upsert({ group_id: groupId, plan_id: planId }, { onConflict: 'group_id,plan_id' });
    if (error) throw new Error(error.message);
  }

  async removePlanFromGroup(groupId: string, planId: string): Promise<void> {
    const { error } = await supabase
      .from('plan_group_plans')
      .delete()
      .eq('group_id', groupId)
      .eq('plan_id', planId);
    if (error) throw new Error(error.message);
  }
}
