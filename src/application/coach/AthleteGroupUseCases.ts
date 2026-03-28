/**
 * Use cases for athlete group management (RF-E2-04a/b).
 */

import {
  AthleteGroup,
  CreateAthleteGroupSchema,
  CreateAthleteGroupInput,
  UpdateAthleteGroupSchema,
  UpdateAthleteGroupInput,
} from '@/domain/entities/AthleteGroup';
import { IAthleteGroupRepository } from '@/domain/repositories/IAthleteGroupRepository';
import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';
import { ICardioRepository } from '@/domain/repositories/ICardioRepository';
import { INutritionRepository } from '@/domain/repositories/INutritionRepository';

export interface AssignContentToGroupInput {
  routineId?:       string | null;
  cardioId?:        string | null;
  nutritionPlanId?: string | null;
}

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

/**
 * Assigns selected content to ALL current members of a group in parallel.
 * Uses Promise.allSettled so every assignment runs even if some fail.
 * Throws if any assignment fails so the caller can notify the user.
 */
export async function assignContentToGroupUseCase(
  groupId: string,
  input: AssignContentToGroupInput,
  groupRepo: IAthleteGroupRepository,
  routineRepo: IRoutineRepository,
  cardioRepo: ICardioRepository,
  nutritionRepo: INutritionRepository,
): Promise<void> {
  if (!groupId) throw new Error('groupId is required');

  const hasContent = input.routineId || input.cardioId || input.nutritionPlanId;
  if (!hasContent) throw new Error('Al menos un contenido debe estar seleccionado');

  const memberIds = await groupRepo.getMembers(groupId);
  if (memberIds.length === 0) return;

  const tasks: Promise<void>[] = [];
  for (const athleteId of memberIds) {
    if (input.routineId)       tasks.push(routineRepo.assignToAthlete(input.routineId, athleteId));
    if (input.cardioId)        tasks.push(cardioRepo.assignToAthlete(input.cardioId, athleteId));
    if (input.nutritionPlanId) tasks.push(nutritionRepo.assignToAthlete(input.nutritionPlanId, athleteId));
  }

  const results = await Promise.allSettled(tasks);
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error('Alguna asignación de contenido ha fallado');
  }
}
