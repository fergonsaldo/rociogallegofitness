import { z } from 'zod';
import { Food } from './Food';

// ── Schemas ───────────────────────────────────────────────────────────────────

const IngredientInputSchema = z.object({
  foodId:    z.string().uuid('foodId inválido'),
  quantityG: z.number().positive('La cantidad debe ser mayor que 0').max(10000),
});

export const CreateRecipeSchema = z.object({
  coachId:           z.string().uuid('Coach ID inválido'),
  name:              z.string().min(1, 'El nombre es obligatorio').max(100),
  instructions:      z.string().max(5000).optional(),
  imagePath:         z.string().optional(),
  tags:              z.array(z.string().min(1).max(50)).max(20),
  showMacros:        z.boolean(),
  visibleToClients:  z.boolean(),
  ingredients:       z.array(IngredientInputSchema),
});

export const UpdateRecipeSchema = z.object({
  name:             z.string().min(1).max(100).optional(),
  instructions:     z.string().max(5000).nullable().optional(),
  imagePath:        z.string().nullable().optional(),
  tags:             z.array(z.string().min(1).max(50)).max(20).optional(),
  showMacros:       z.boolean().optional(),
  visibleToClients: z.boolean().optional(),
  ingredients:      z.array(IngredientInputSchema).optional(),
});

export const RecipeIngredientSchema = z.object({
  id:        z.string().uuid(),
  recipeId:  z.string().uuid(),
  foodId:    z.string().uuid(),
  quantityG: z.number().positive(),
  createdAt: z.date(),
});

export const RecipeSchema = z.object({
  id:               z.string().uuid(),
  coachId:          z.string().uuid(),
  name:             z.string(),
  instructions:     z.string().nullable(),
  imagePath:        z.string().nullable(),
  imageUrl:         z.string().nullable(),
  tags:             z.array(z.string()),
  showMacros:       z.boolean(),
  visibleToClients: z.boolean(),
  createdAt:        z.date(),
  updatedAt:        z.date(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type Recipe              = z.infer<typeof RecipeSchema>;
export type RecipeIngredient    = z.infer<typeof RecipeIngredientSchema>;
export type CreateRecipeInput   = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipeInput   = z.infer<typeof UpdateRecipeSchema>;
export type IngredientInput     = z.infer<typeof IngredientInputSchema>;

export interface RecipeIngredientWithFood extends RecipeIngredient {
  food: Food;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredientWithFood[];
}

export interface RecipeMacros {
  calories: number;
  proteinG: number;
  carbsG:   number;
  fatG:     number;
  fiberG:   number;
}
