/**
 * Use cases for athlete group management (RF-E2-04a).
 */

import {
  AthleteGroup,
  CreateAthleteGroupSchema,
  CreateAthleteGroupInput,
  UpdateAthleteGroupSchema,
  UpdateAthleteGroupInput,
} from '@/domain/entities/AthleteGroup';
import { IAthleteGroupRepository } from '@/domain/repositories/IAthleteGroupRepository';

export async function getGroupsUseCase(
  coachId: string,
  repo: IAthleteGroupRepository,
): Promise<AthleteGroup[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

export async function createGroupUseCase(
  input: CreateAthleteGroupInput,
  repo: IAthleteGroupRepository,
): Promise<AthleteGroup> {
  CreateAthleteGroupSchema.parse(input);
  return repo.create({ ...input, name: input.name.trim() });
}

export async function updateGroupUseCase(
  id: string,
  input: UpdateAthleteGroupInput,
  repo: IAthleteGroupRepository,
): Promise<AthleteGroup> {
  if (!id) throw new Error('id is required');
  UpdateAthleteGroupSchema.parse(input);
  const patch: UpdateAthleteGroupInput = { ...input };
  if (patch.name) patch.name = patch.name.trim();
  return repo.update(id, patch);
}

export async function deleteGroupUseCase(
  id: string,
  repo: IAthleteGroupRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}

export async function getGroupMembersUseCase(
  groupId: string,
  repo: IAthleteGroupRepository,
): Promise<string[]> {
  if (!groupId) throw new Error('groupId is required');
  return repo.getMembers(groupId);
}

export async function addMemberToGroupUseCase(
  groupId: string,
  athleteId: string,
  repo: IAthleteGroupRepository,
): Promise<void> {
  if (!groupId)   throw new Error('groupId is required');
  if (!athleteId) throw new Error('athleteId is required');
  return repo.addMember(groupId, athleteId);
}

export async function removeMemberFromGroupUseCase(
  groupId: string,
  athleteId: string,
  repo: IAthleteGroupRepository,
): Promise<void> {
  if (!groupId)   throw new Error('groupId is required');
  if (!athleteId) throw new Error('athleteId is required');
  return repo.removeMember(groupId, athleteId);
}
