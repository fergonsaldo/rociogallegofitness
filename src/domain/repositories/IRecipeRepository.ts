import {
  Recipe,
  RecipeWithIngredients,
  CreateRecipeInput,
  UpdateRecipeInput,
} from '@/domain/entities/Recipe';

export interface IRecipeRepository {
  getRecipesByCoach(coachId: string): Promise<Recipe[]>;
  getRecipeDetail(id: string, coachId: string): Promise<RecipeWithIngredients>;
  createRecipe(input: CreateRecipeInput): Promise<Recipe>;
  updateRecipe(id: string, coachId: string, input: UpdateRecipeInput): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  uploadImage(coachId: string, localUri: string): Promise<string>;
  deleteImage(imagePath: string): Promise<void>;
}
