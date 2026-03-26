import { NutritionPlan, CreateNutritionPlanInput, MealLogEntry, CreateMealLogEntryInput, LinkedRecipe } from '../entities/NutritionPlan';

export interface INutritionRepository {
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
