import { Food, CreateFoodSchema, FoodType } from '@/domain/entities/Food';
import { IFoodRepository } from '@/domain/repositories/IFoodRepository';

// ── GetFoods ──────────────────────────────────────────────────────────────────

export async function getFoodsUseCase(
  coachId: string,
  repo: IFoodRepository,
): Promise<Food[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getFoodsByCoach(coachId);
}

// ── CreateFood ────────────────────────────────────────────────────────────────

export async function createFoodUseCase(
  input: unknown,
  repo: IFoodRepository,
): Promise<Food> {
  const validated = CreateFoodSchema.parse(input);
  return repo.createFood(validated);
}

// ── DeleteFood ────────────────────────────────────────────────────────────────

export async function deleteFoodUseCase(
  id: string,
  repo: IFoodRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.deleteFood(id);
}

// ── filterFoods (pure) ────────────────────────────────────────────────────────

export function filterFoods(
  items: Food[],
  query: string,
  types: FoodType[],
  showOwn: boolean,
  coachId: string,
): Food[] {
  let result = items;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter((f) => f.name.toLowerCase().includes(q));
  }

  if (showOwn) {
    result = result.filter((f) => f.coachId === coachId);
  } else if (types.length > 0) {
    result = result.filter((f) => types.includes(f.type));
  }

  return result;
}
