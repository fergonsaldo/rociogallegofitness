import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';
import { validateUUID } from '@/domain/validation/validateUUID';

export interface AssignRoutineInput {
  routineId: string;
  athleteId: string;
}

export async function assignRoutineUseCase(
  input: AssignRoutineInput,
  repo: IRoutineRepository,
): Promise<void> {
  if (!validateUUID(input.routineId)) throw new Error('Invalid routine ID');
  if (!validateUUID(input.athleteId)) throw new Error('Invalid athlete ID');
  await repo.assignToAthlete(input.routineId, input.athleteId);
}

export async function unassignRoutineUseCase(
  input: AssignRoutineInput,
  repo: IRoutineRepository,
): Promise<void> {
  if (!validateUUID(input.routineId)) throw new Error('Invalid routine ID');
  if (!validateUUID(input.athleteId)) throw new Error('Invalid athlete ID');
  await repo.unassignFromAthlete(input.routineId, input.athleteId);
}
