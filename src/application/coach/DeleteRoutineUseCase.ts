import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';
import { Strings } from '@/shared/constants/strings';

/**
 * Deletes a routine owned by the coach.
 * Throws if the routine is currently assigned to any athlete,
 * preventing accidental data loss for active clients.
 */
export async function deleteRoutineUseCase(
  routineId: string,
  repo: IRoutineRepository,
): Promise<void> {
  const isAssigned = await repo.hasAssignments(routineId);

  if (isAssigned) {
    throw new Error(Strings.errorRoutineHasAssignments);
  }

  await repo.delete(routineId);
}
