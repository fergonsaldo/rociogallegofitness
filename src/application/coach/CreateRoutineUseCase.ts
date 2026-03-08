import { z } from 'zod';
import { Routine, CreateRoutineSchema } from '@/domain/entities/Routine';
import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';

export const CreateRoutineInputSchema = CreateRoutineSchema;
export type CreateRoutineUseCaseInput = z.infer<typeof CreateRoutineInputSchema>;

/**
 * Creates a new routine (header + days + exercises) for a coach.
 * Validates the input with Zod before persisting.
 */
export async function createRoutineUseCase(
  input: CreateRoutineUseCaseInput,
  repository: IRoutineRepository
): Promise<Routine> {
  CreateRoutineInputSchema.parse(input);
  return repository.create(input);
}
