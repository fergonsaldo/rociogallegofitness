import { z } from 'zod';

// ── Plan type ─────────────────────────────────────────────────────────────────

export const PLAN_TYPES = ['deficit', 'maintenance', 'surplus', 'other'] as const;
export type PlanType = typeof PLAN_TYPES[number];

// ── Macros value object ───────────────────────────────────────────────────────

export const MacrosSchema = z.object({
  calories: z.number().int().min(0).max(20000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(1000),
});

export type Macros = z.infer<typeof MacrosSchema>;

export function macroPercentages(macros: Macros): { protein: number; carbs: number; fat: number } {
  const fromProtein = macros.proteinG * 4;
  const fromCarbs = macros.carbsG * 4;
  const fromFat = macros.fatG * 9;
  const total = fromProtein + fromCarbs + fromFat || 1;
  return {
    protein: Math.round((fromProtein / total) * 100),
    carbs: Math.round((fromCarbs / total) * 100),
    fat: Math.round((fromFat / total) * 100),
  };
}

// ── Meal ──────────────────────────────────────────────────────────────────────

export const LinkedRecipeSchema = z.object({
  id:   z.string().uuid(),
  name: z.string(),
});

export type LinkedRecipe = z.infer<typeof LinkedRecipeSchema>;

export const MealSchema = z.object({
  id: z.string(),
  nutritionPlanId: z.string(),
  name: z.string().min(1).max(100),
  order: z.number().int().min(1),
  targetMacros: MacrosSchema,
  notes: z.string().max(500).optional(),
  linkedRecipes: z.array(LinkedRecipeSchema).default([]),
});

export type Meal = z.infer<typeof MealSchema>;

// ── NutritionPlan ─────────────────────────────────────────────────────────────

export const NutritionPlanSchema = z.object({
  id: z.string(),
  coachId: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(PLAN_TYPES),
  description: z.string().max(500).optional(),
  dailyTargetMacros: MacrosSchema,
  meals: z.array(MealSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NutritionPlan = z.infer<typeof NutritionPlanSchema>;

export const CreateNutritionPlanSchema = z.object({
  coachId: z.string().uuid(),
  name: z.string().min(1, 'El nombre del plan es obligatorio').max(100),
  type: z.enum(PLAN_TYPES),
  description: z.string().max(500).optional(),
  dailyTargetMacros: MacrosSchema,
  meals: z.array(z.object({
    name: z.string().min(1).max(100),
    order: z.number().int().min(1),
    targetMacros: MacrosSchema,
    notes: z.string().max(500).optional(),
  })).min(1, 'At least one meal is required'),
});

export type CreateNutritionPlanInput = z.infer<typeof CreateNutritionPlanSchema>;

// ── MealLog ────────────────────────────────────────────────────────────────────

export const MealLogEntrySchema = z.object({
  id: z.string(),
  mealId: z.string(),
  athleteId: z.string(),
  loggedAt: z.date(),
  actualMacros: MacrosSchema,
  notes: z.string().max(500).optional(),
});

export type MealLogEntry = z.infer<typeof MealLogEntrySchema>;

export const CreateMealLogEntrySchema = z.object({
  mealId: z.string().uuid(),
  athleteId: z.string().uuid(),
  actualMacros: MacrosSchema,
  notes: z.string().max(500).optional(),
});

export type CreateMealLogEntryInput = z.infer<typeof CreateMealLogEntrySchema>;

// ── PlanVersion ───────────────────────────────────────────────────────────────

export const PlanVersionSchema = z.object({
  id:                z.string().uuid(),
  planId:            z.string().uuid(),
  savedAt:           z.date(),
  savedBy:           z.string().uuid(),
  name:              z.string(),
  type:              z.enum(PLAN_TYPES),
  description:       z.string().optional(),
  dailyTargetMacros: MacrosSchema,
});

export type PlanVersion = z.infer<typeof PlanVersionSchema>;

export const UpdatePlanMetaSchema = z.object({
  name:              z.string().min(1, 'El nombre es obligatorio').max(100).optional(),
  type:              z.enum(PLAN_TYPES).optional(),
  description:       z.string().max(500).nullable().optional(),
  dailyTargetMacros: MacrosSchema.optional(),
});

export type UpdatePlanMetaInput = z.infer<typeof UpdatePlanMetaSchema>;

// ── PlanGroup ─────────────────────────────────────────────────────────────────

export const PlanGroupSchema = z.object({
  id:          z.string().uuid(),
  coachId:     z.string().uuid(),
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  planCount:   z.number().int().min(0),
  createdAt:   z.date(),
});

export type PlanGroup = z.infer<typeof PlanGroupSchema>;

export const CreatePlanGroupSchema = z.object({
  coachId:     z.string().uuid('El ID del coach no es válido'),
  name:        z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
});

export type CreatePlanGroupInput = z.infer<typeof CreatePlanGroupSchema>;

// ── DailyNutritionSummary ─────────────────────────────────────────────────────

export interface DailyNutritionSummary {
  date: Date;
  totalConsumed: Macros;
  dailyTarget: Macros;
  progress: { calories: number; protein: number; carbs: number; fat: number };
  logEntries: MealLogEntry[];
}

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}
