import { z } from 'zod';
import { NutritionPlan, CreateNutritionPlanSchema, PlanType } from '@/domain/entities/NutritionPlan';
import { INutritionRepository } from '@/domain/repositories/INutritionRepository';

// ── CreateNutritionPlan ───────────────────────────────────────────────────────

/**
 * Creates a new nutrition plan with its meals.
 * Validates with Zod — will throw ZodError on bad input.
 */
export async function createNutritionPlanUseCase(
  input: unknown,
  repo: INutritionRepository
): Promise<NutritionPlan> {
  const validated = CreateNutritionPlanSchema.parse(input);
  return repo.createPlan(validated);
}

// ── GetCoachPlans ─────────────────────────────────────────────────────────────

export async function getCoachNutritionPlansUseCase(
  coachId: string,
  repo: INutritionRepository
): Promise<NutritionPlan[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getPlansByCoach(coachId);
}

// ── AssignNutritionPlan ───────────────────────────────────────────────────────

const AssignSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  athleteId: z.string().uuid('Invalid athlete ID'),
});

export async function assignNutritionPlanUseCase(
  input: { planId: string; athleteId: string },
  repo: INutritionRepository
): Promise<void> {
  AssignSchema.parse(input);

  const plan = await repo.getPlanById(input.planId);
  if (!plan) throw new Error('Nutrition plan not found');

  await repo.assignToAthlete(input.planId, input.athleteId);
}

export async function unassignNutritionPlanUseCase(
  input: { planId: string; athleteId: string },
  repo: INutritionRepository
): Promise<void> {
  AssignSchema.parse(input);
  await repo.unassignFromAthlete(input.planId, input.athleteId);
}

// ── LinkRecipeToMeal ──────────────────────────────────────────────────────────

export async function linkRecipeToMealUseCase(
  mealId: string,
  recipeId: string,
  repo: INutritionRepository,
): Promise<void> {
  if (!mealId)   throw new Error('mealId is required');
  if (!recipeId) throw new Error('recipeId is required');
  return repo.linkRecipeToMeal(mealId, recipeId);
}

export async function unlinkRecipeFromMealUseCase(
  mealId: string,
  recipeId: string,
  repo: INutritionRepository,
): Promise<void> {
  if (!mealId)   throw new Error('mealId is required');
  if (!recipeId) throw new Error('recipeId is required');
  return repo.unlinkRecipeFromMeal(mealId, recipeId);
}

// ── DuplicatePlan ─────────────────────────────────────────────────────────────

const COPY_PREFIX = '(Copia) ';
const MAX_NAME_LENGTH = 100;

export async function duplicatePlanUseCase(
  plan: NutritionPlan,
  coachId: string,
  repo: INutritionRepository,
): Promise<NutritionPlan> {
  if (!coachId) throw new Error('coachId is required');

  const name = (COPY_PREFIX + plan.name).substring(0, MAX_NAME_LENGTH);

  return repo.createPlan({
    coachId,
    name,
    type:              plan.type,
    description:       plan.description,
    dailyTargetMacros: plan.dailyTargetMacros,
    meals: plan.meals.map((m) => ({
      name:         m.name,
      order:        m.order,
      targetMacros: m.targetMacros,
      notes:        m.notes,
    })),
  });
}

// ── AssignPlansToAthlete (bulk) ───────────────────────────────────────────────

export async function assignPlansToAthleteUseCase(
  planIds: string[],
  athleteId: string,
  repo: INutritionRepository,
): Promise<void> {
  if (!athleteId) throw new Error('athleteId is required');
  if (planIds.length === 0) throw new Error('planIds must not be empty');
  for (const planId of planIds) {
    await repo.assignToAthlete(planId, athleteId);
  }
}

// ── DeleteNutritionPlan ───────────────────────────────────────────────────────

export async function deleteNutritionPlanUseCase(
  planId: string,
  repo: INutritionRepository
): Promise<void> {
  if (!planId) throw new Error('planId is required');
  await repo.deletePlan(planId);
}

// ── Pure filter (exported for testing) ───────────────────────────────────────

export function filterNutritionPlans(
  items: NutritionPlan[],
  query: string,
  types: PlanType[],
): NutritionPlan[] {
  let result = items;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q),
    );
  }

  if (types.length > 0) {
    result = result.filter((p) => types.includes(p.type));
  }

  return result;
}
