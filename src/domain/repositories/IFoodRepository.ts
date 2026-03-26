import { Food, CreateFoodInput, UpdateFoodInput } from '@/domain/entities/Food';

export interface IFoodRepository {
  /** Returns base catalog + coach-owned foods */
  getFoodsByCoach(coachId: string): Promise<Food[]>;

  /** Creates a new coach-owned food */
  createFood(input: CreateFoodInput): Promise<Food>;

  /** Updates an existing coach-owned food */
  updateFood(id: string, input: UpdateFoodInput): Promise<Food>;

  /** Creates a coach-owned copy of a generic food with new values */
  cloneGenericFood(coachId: string, input: UpdateFoodInput): Promise<Food>;

  /** Deletes a coach-owned food (only own foods) */
  deleteFood(id: string): Promise<void>;

  /** Returns true if the food is referenced by any recipe ingredient */
  isUsedInRecipes(foodId: string): Promise<boolean>;
}
