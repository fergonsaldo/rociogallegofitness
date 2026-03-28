/**
 * Use cases for coach session type management (RF-E8-05).
 */

import { SessionType, CreateSessionTypeInput } from '@/domain/entities/SessionType';
import { ISessionTypeRepository, UpdateSessionTypeInput } from '@/domain/repositories/ISessionTypeRepository';

export async function getSessionTypesUseCase(
  coachId: string,
  repo: ISessionTypeRepository,
): Promise<SessionType[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

export async function createSessionTypeUseCase(
  input: CreateSessionTypeInput,
  repo: ISessionTypeRepository,
): Promise<SessionType> {
  if (!input.coachId) throw new Error('coachId is required');
  if (!input.name.trim()) throw new Error('name is required');
  return repo.create({ ...input, name: input.name.trim() });
}

export async function updateSessionTypeUseCase(
  id: string,
  input: UpdateSessionTypeInput,
  repo: ISessionTypeRepository,
): Promise<SessionType> {
  if (!id) throw new Error('id is required');
  if (input.name !== undefined && !input.name.trim()) throw new Error('name cannot be empty');
  const patch: UpdateSessionTypeInput = { ...input };
  if (patch.name) patch.name = patch.name.trim();
  return repo.update(id, patch);
}

export async function deleteSessionTypeUseCase(
  id: string,
  repo: ISessionTypeRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}
