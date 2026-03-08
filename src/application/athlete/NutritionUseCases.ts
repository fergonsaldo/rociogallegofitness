import {
  NutritionPlan, MealLogEntry, DailyNutritionSummary,
  CreateMealLogEntrySchema, CreateMealLogEntryInput,
  sumMacros, Macros,
} from '@/domain/entities/NutritionPlan';
import { INutritionRepository } from '@/domain/repositories/INutritionRepository';

// ── GetAssignedPlan ───────────────────────────────────────────────────────────

export async function getAssignedNutritionPlanUseCase(
  athleteId: string,
  repo: INutritionRepository
): Promise<NutritionPlan | null> {
  if (!athleteId) throw new Error('athleteId is required');
  return repo.getAssignedPlan(athleteId);
}

// ── LogMeal ───────────────────────────────────────────────────────────────────

/**
 * Logs actual macros consumed for a meal.
 * Validates with Zod — calories field is auto-calculated from macros
 * if not explicitly provided (4-4-9 formula).
 */
export async function logMealUseCase(
  input: CreateMealLogEntryInput,
  repo: INutritionRepository
): Promise<MealLogEntry> {
  const validated = CreateMealLogEntrySchema.parse(input);

  // Auto-calculate calories from macros if they don't add up
  const calculatedCals = Math.round(
    validated.actualMacros.proteinG * 4 +
    validated.actualMacros.carbsG * 4 +
    validated.actualMacros.fatG * 9
  );

  // Accept user-provided calories if within 10% of calculated, otherwise override
  const finalInput = {
    ...validated,
    actualMacros: {
      ...validated.actualMacros,
      calories: validated.actualMacros.calories === 0
        ? calculatedCals
        : validated.actualMacros.calories,
    },
  };

  return repo.logMeal(finalInput);
}

// ── GetDailySummary ───────────────────────────────────────────────────────────

/**
 * Builds a DailyNutritionSummary for a given date.
 * Aggregates all meal log entries for that day and computes
 * progress ratios against the plan's daily targets.
 */
export async function getDailyNutritionSummaryUseCase(
  athleteId: string,
  date: Date,
  plan: NutritionPlan,
  repo: INutritionRepository
): Promise<DailyNutritionSummary> {
  if (!athleteId) throw new Error('athleteId is required');

  const entries = await repo.getLogEntriesForDay(athleteId, date);
  const totalConsumed = sumMacros(entries.map((e) => e.actualMacros));

  const target = plan.dailyTargetMacros;
  const clamp = (v: number) => Math.min(1, v);

  return {
    date,
    totalConsumed,
    dailyTarget: target,
    progress: {
      calories: clamp(totalConsumed.calories / (target.calories || 1)),
      protein:  clamp(totalConsumed.proteinG / (target.proteinG || 1)),
      carbs:    clamp(totalConsumed.carbsG   / (target.carbsG   || 1)),
      fat:      clamp(totalConsumed.fatG     / (target.fatG     || 1)),
    },
    logEntries: entries,
  };
}

// ── GetWeeklyAdherence ────────────────────────────────────────────────────────

export interface WeeklyAdherenceDay {
  date: Date;
  calorieProgress: number; // 0-1
  logged: boolean;
}

/**
 * Returns one adherence entry per day for the past 7 days.
 * Used for the weekly progress bar strip in the nutrition screen.
 */
export async function getWeeklyAdherenceUseCase(
  athleteId: string,
  plan: NutritionPlan,
  repo: INutritionRepository
): Promise<WeeklyAdherenceDay[]> {
  if (!athleteId) throw new Error('athleteId is required');

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const entries = await repo.getLogEntriesForRange(athleteId, weekAgo, today);

  // Group by date string
  const byDay = new Map<string, Macros[]>();
  for (const entry of entries) {
    const key = entry.loggedAt.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(entry.actualMacros);
  }

  const result: WeeklyAdherenceDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toDateString();
    const dayEntries = byDay.get(key) ?? [];
    const total = sumMacros(dayEntries);
    const progress = Math.min(1, total.calories / (plan.dailyTargetMacros.calories || 1));
    result.push({ date: d, calorieProgress: progress, logged: dayEntries.length > 0 });
  }

  return result;
}
