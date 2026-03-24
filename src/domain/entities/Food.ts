import { z } from 'zod';

// ── Food types ────────────────────────────────────────────────────────────────

export const FOOD_TYPES = ['generic', 'specific', 'supplement'] as const;
export type FoodType = typeof FOOD_TYPES[number];

// ── Food entity ───────────────────────────────────────────────────────────────

export const FoodSchema = z.object({
  id:               z.string().uuid(),
  coachId:          z.string().uuid().nullable(),
  name:             z.string().min(1).max(100),
  type:             z.enum(FOOD_TYPES),
  caloriesPer100g:  z.number().min(0),
  proteinG:         z.number().min(0),
  carbsG:           z.number().min(0),
  fatG:             z.number().min(0),
  fiberG:           z.number().min(0),
  createdAt:        z.date(),
});

export type Food = z.infer<typeof FoodSchema>;

// ── Create input ──────────────────────────────────────────────────────────────

export const CreateFoodSchema = z.object({
  coachId:         z.string().uuid('Coach ID inválido'),
  name:            z.string().min(1, 'El nombre es obligatorio').max(100),
  type:            z.enum(FOOD_TYPES),
  caloriesPer100g: z.number().min(0).max(10000),
  proteinG:        z.number().min(0).max(100),
  carbsG:          z.number().min(0).max(100),
  fatG:            z.number().min(0).max(100),
  fiberG:          z.number().min(0).max(100),
});

export type CreateFoodInput = z.infer<typeof CreateFoodSchema>;
