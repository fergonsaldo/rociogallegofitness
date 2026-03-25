import * as FileSystem from 'expo-file-system';
import { supabase } from '../client';
import { IRecipeRepository } from '@/domain/repositories/IRecipeRepository';
import {
  Recipe,
  RecipeWithIngredients,
  RecipeIngredientWithFood,
  CreateRecipeInput,
  UpdateRecipeInput,
} from '@/domain/entities/Recipe';
import { Food, FoodType } from '@/domain/entities/Food';

const BUCKET             = 'recipe-images';
const SIGNED_URL_EXPIRES = 60 * 60; // 1 hour

export class RecipeRemoteRepository implements IRecipeRepository {

  private mapRecipe(row: any, imageUrl: string | null = null): Recipe {
    return {
      id:               row.id,
      coachId:          row.coach_id,
      name:             row.name,
      instructions:     row.instructions ?? null,
      imagePath:        row.image_path ?? null,
      imageUrl,
      tags:             row.tags ?? [],
      showMacros:       row.show_macros,
      visibleToClients: row.visible_to_clients,
      createdAt:        new Date(row.created_at),
      updatedAt:        new Date(row.updated_at),
    };
  }

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

  private async generateSignedUrl(imagePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(imagePath, SIGNED_URL_EXPIRES);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  async getRecipesByCoach(coachId: string): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('coach_id', coachId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapRecipe(row));
  }

  async getRecipeDetail(id: string, coachId: string): Promise<RecipeWithIngredients> {
    const [recipeResult, ingredientsResult] = await Promise.all([
      supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('coach_id', coachId)
        .single(),
      supabase
        .from('recipe_ingredients')
        .select('*, food:foods(*)')
        .eq('recipe_id', id),
    ]);

    if (recipeResult.error || !recipeResult.data) throw recipeResult.error ?? new Error('Recipe not found');
    if (ingredientsResult.error) throw ingredientsResult.error;

    const row = recipeResult.data;
    const imageUrl = row.image_path ? await this.generateSignedUrl(row.image_path) : null;
    const recipe = this.mapRecipe(row, imageUrl);

    const ingredients: RecipeIngredientWithFood[] = (ingredientsResult.data ?? []).map((i: any) => ({
      id:        i.id,
      recipeId:  i.recipe_id,
      foodId:    i.food_id,
      quantityG: Number(i.quantity_g),
      createdAt: new Date(i.created_at),
      food:      this.mapFood(i.food),
    }));

    return { ...recipe, ingredients };
  }

  async createRecipe(input: CreateRecipeInput): Promise<Recipe> {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        coach_id:           input.coachId,
        name:               input.name,
        instructions:       input.instructions ?? null,
        image_path:         input.imagePath ?? null,
        tags:               input.tags,
        show_macros:        input.showMacros,
        visible_to_clients: input.visibleToClients,
      })
      .select()
      .single();

    if (error || !data) throw error;

    if (input.ingredients.length > 0) {
      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(
          input.ingredients.map((i) => ({
            recipe_id:  data.id,
            food_id:    i.foodId,
            quantity_g: i.quantityG,
          })),
        );
      if (ingError) throw ingError;
    }

    return this.mapRecipe(data);
  }

  async updateRecipe(id: string, coachId: string, input: UpdateRecipeInput): Promise<Recipe> {
    const updatePayload: Record<string, unknown> = {};
    if (input.name             !== undefined) updatePayload.name               = input.name;
    if (input.instructions     !== undefined) updatePayload.instructions       = input.instructions;
    if (input.imagePath        !== undefined) updatePayload.image_path         = input.imagePath;
    if (input.tags             !== undefined) updatePayload.tags               = input.tags;
    if (input.showMacros       !== undefined) updatePayload.show_macros        = input.showMacros;
    if (input.visibleToClients !== undefined) updatePayload.visible_to_clients = input.visibleToClients;

    const { data, error } = await supabase
      .from('recipes')
      .update(updatePayload)
      .eq('id', id)
      .eq('coach_id', coachId)
      .select()
      .single();

    if (error || !data) throw error;

    if (input.ingredients !== undefined) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      if (input.ingredients.length > 0) {
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(
            input.ingredients.map((i) => ({
              recipe_id:  id,
              food_id:    i.foodId,
              quantity_g: i.quantityG,
            })),
          );
        if (ingError) throw ingError;
      }
    }

    return this.mapRecipe(data);
  }

  async deleteRecipe(id: string): Promise<void> {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  }

  async uploadImage(coachId: string, localUri: string): Promise<string> {
    const rawExt   = localUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const ext      = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const filename = `${coachId}/${Date.now()}.${ext}`;

    // React Native Blobs from fetch() are not compatible with Supabase Storage SDK.
    // Read as base64 via expo-file-system and convert to Uint8Array instead.
    const base64    = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64' as any,
    });
    const binaryStr = atob(base64);
    const bytes     = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, bytes, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Storage upload: ${error.message} (${error.statusCode})`);
    return filename;
  }

  async deleteImage(imagePath: string): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET).remove([imagePath]);
    if (error) throw error;
  }
}
