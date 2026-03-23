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

export async function assignMultipleRoutinesUseCase(
  routineIds: string[],
  athleteId: string,
  repo: IRoutineRepository,
): Promise<void> {
  if (routineIds.length === 0) throw new Error('routineIds must not be empty');
  if (!validateUUID(athleteId)) throw new Error('Invalid athlete ID');
  for (const id of routineIds) {
    if (!validateUUID(id)) throw new Error(`Invalid routine ID: ${id}`);
  }
  await Promise.all(routineIds.map((id) => repo.assignToAthlete(id, athleteId)));
}
