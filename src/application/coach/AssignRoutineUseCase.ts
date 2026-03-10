import { z } from 'zod';
import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';

export const AssignRoutineInputSchema = z.object({
  routineId: z.string().uuid('Invalid routine ID'),
  athleteId: z.string().uuid('Invalid athlete ID'),
});

export type AssignRoutineInput = z.infer<typeof AssignRoutineInputSchema>;

/**
 * Assigns an existing routine to an athlete.
 * If the athlete already has this routine assigned, this is a no-op (upsert).
 */
export async function assignRoutineUseCase(
  input: AssignRoutineInput,
  repository: IRoutineRepository
): Promise<void> {
  console.log('[assignRoutineUseCase] input:', input);
  AssignRoutineInputSchema.parse(input);
  console.log('[assignRoutineUseCase] validación OK, llamando a repository.assignToAthlete');
  await repository.assignToAthlete(input.routineId, input.athleteId);
  console.log('[assignRoutineUseCase] asignación completada');
}

/**
 * Removes the assignment of a routine from an athlete.
 */
export async function unassignRoutineUseCase(
  input: AssignRoutineInput,
  repository: IRoutineRepository
): Promise<void> {
  AssignRoutineInputSchema.parse(input);
  await repository.unassignFromAthlete(input.routineId, input.athleteId);
}
