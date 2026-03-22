/**
 * Use cases for coach tag management (RF-E2-05a).
 */

import { ClientTag, CreateClientTagInput } from '@/domain/entities/ClientTag';
import { ITagRepository, UpdateClientTagInput } from '@/domain/repositories/ITagRepository';

export async function getTagsUseCase(
  coachId: string,
  repo: ITagRepository,
): Promise<ClientTag[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

export async function createTagUseCase(
  input: CreateClientTagInput,
  repo: ITagRepository,
): Promise<ClientTag> {
  if (!input.coachId) throw new Error('coachId is required');
  if (!input.name.trim()) throw new Error('name is required');
  return repo.create({ ...input, name: input.name.trim() });
}

export async function updateTagUseCase(
  id: string,
  input: UpdateClientTagInput,
  repo: ITagRepository,
): Promise<ClientTag> {
  if (!id) throw new Error('id is required');
  if (input.name !== undefined && !input.name.trim()) throw new Error('name cannot be empty');
  const patch: UpdateClientTagInput = { ...input };
  if (patch.name) patch.name = patch.name.trim();
  return repo.update(id, patch);
}

export async function deleteTagUseCase(
  id: string,
  repo: ITagRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}
