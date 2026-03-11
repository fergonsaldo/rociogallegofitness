import { ICustomExerciseRepository } from '@/domain/repositories/ICustomExerciseRepository';
import {
  CustomExercise,
  CreateCustomExerciseInput,
  CreateCustomExerciseSchema,
} from '@/domain/entities/CustomExercise';

/**
 * Returns all custom exercises created by the given coach.
 */
export async function getCoachCustomExercisesUseCase(
  coachId: string,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

/**
 * Validates and creates a custom exercise for a coach.
 * Throws a ZodError if validation fails, so the caller can surface
 * field-level messages directly in the UI.
 */
export async function createCustomExerciseUseCase(
  input: CreateCustomExerciseInput,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise> {
  CreateCustomExerciseSchema.parse(input);
  return repo.create(input);
}
