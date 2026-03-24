import { Food, CreateFoodInput } from '@/domain/entities/Food';

export interface IFoodRepository {
  /** Returns base catalog + coach-owned foods */
  getFoodsByCoach(coachId: string): Promise<Food[]>;

  /** Creates a new coach-owned food */
  createFood(input: CreateFoodInput): Promise<Food>;

  /** Deletes a coach-owned food (only own foods) */
  deleteFood(id: string): Promise<void>;
}
