import { Routine } from '@/domain/entities/Routine';
import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';

/**
 * Returns all routines created by a coach, ordered newest first.
 */
export async function getCoachRoutinesUseCase(
  coachId: string,
  repository: IRoutineRepository
): Promise<Routine[]> {
  if (!coachId) throw new Error('coachId is required');
  return repository.getByCoachId(coachId);
}

/**
 * Returns all routines assigned to an athlete by their coach.
 */
export async function getAthleteRoutinesUseCase(
  athleteId: string,
  repository: IRoutineRepository
): Promise<Routine[]> {
  if (!athleteId) throw new Error('athleteId is required');
  return repository.getByAthleteId(athleteId);
}

/**
 * Returns a single routine by id, or null if not found.
 */
export async function getRoutineByIdUseCase(
  routineId: string,
  repository: IRoutineRepository
): Promise<Routine | null> {
  if (!routineId) throw new Error('routineId is required');
  return repository.getById(routineId);
}
