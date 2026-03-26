import { NutritionPlan, CreateNutritionPlanInput, MealLogEntry, CreateMealLogEntryInput, LinkedRecipe, PlanGroup, CreatePlanGroupInput } from '../entities/NutritionPlan';

export interface INutritionRepository {
  // ── Plan groups ───────────────────────────────────────────────────────────
  createPlanGroup(input: CreatePlanGroupInput): Promise<PlanGroup>;
  deletePlanGroup(groupId: string): Promise<void>;
  getPlanGroups(coachId: string): Promise<PlanGroup[]>;
  getPlanGroupDetail(groupId: string): Promise<{ group: PlanGroup; plans: NutritionPlan[] }>;
  addPlanToGroup(groupId: string, planId: string): Promise<void>;
  removePlanFromGroup(groupId: string, planId: string): Promise<void>;

  // ── Plans (coach) ─────────────────────────────────────────────────────────
  createPlan(input: CreateNutritionPlanInput): Promise<NutritionPlan>;
  getPlansByCoach(coachId: string): Promise<NutritionPlan[]>;
  getPlanById(id: string): Promise<NutritionPlan | null>;
  deletePlan(id: string): Promise<void>;

  // ── Assignments ───────────────────────────────────────────────────────────
  assignToAthlete(planId: string, athleteId: string): Promise<void>;
  unassignFromAthlete(planId: string, athleteId: string): Promise<void>;

  // ── Meal recipes ──────────────────────────────────────────────────────────
  linkRecipeToMeal(mealId: string, recipeId: string): Promise<void>;
  unlinkRecipeFromMeal(mealId: string, recipeId: string): Promise<void>;

  // ── Plans (athlete) ───────────────────────────────────────────────────────
  /** Returns the plan currently assigned to an athlete, or null */
  getAssignedPlan(athleteId: string): Promise<NutritionPlan | null>;

  // ── Meal log ──────────────────────────────────────────────────────────────
  logMeal(input: CreateMealLogEntryInput): Promise<MealLogEntry>;
  getLogEntriesForDay(athleteId: string, date: Date): Promise<MealLogEntry[]>;
  getLogEntriesForRange(athleteId: string, from: Date, to: Date): Promise<MealLogEntry[]>;
}
