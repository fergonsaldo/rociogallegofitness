import { ICustomExerciseRepository, UpdateCustomExerciseInput } from '@/domain/repositories/ICustomExerciseRepository';
import {
  CustomExercise,
  CreateCustomExerciseInput,
  CreateCustomExerciseSchema,
} from '@/domain/entities/CustomExercise';

export async function getCoachCustomExercisesUseCase(
  coachId: string,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

export async function createCustomExerciseUseCase(
  input: CreateCustomExerciseInput,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise> {
  CreateCustomExerciseSchema.parse(input);
  return repo.create(input);
}

export async function updateCustomExerciseUseCase(
  id: string,
  input: UpdateCustomExerciseInput,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise> {
  if (!id) throw new Error('id is required');
  // Validate only the fields being updated using a partial parse
  const partial = CreateCustomExerciseSchema.omit({ coachId: true }).partial();
  partial.parse(input);
  return repo.update(id, input);
}

export async function deleteCustomExerciseUseCase(
  id: string,
  repo: ICustomExerciseRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');

  const inUse = await repo.isInUse(id);
  if (inUse) {
    throw new Error('No se puede eliminar un ejercicio que está en uso en una rutina activa');
  }

  return repo.delete(id);
}
