/**
 * Use cases for tag automation (RF-E2-06).
 * When a tag is assigned to an athlete, these use cases handle reading,
 * saving, and executing the content auto-assignments bound to that tag.
 */

import { TagAutomation, SaveTagAutomationSchema, SaveTagAutomationInput } from '@/domain/entities/TagAutomation';
import { ITagAutomationRepository } from '@/domain/repositories/ITagAutomationRepository';
import { IRoutineRepository } from '@/domain/repositories/IRoutineRepository';
import { ICardioRepository } from '@/domain/repositories/ICardioRepository';
import { INutritionRepository } from '@/domain/repositories/INutritionRepository';

export async function getTagAutomationUseCase(
  tagId: string,
  repo: ITagAutomationRepository,
): Promise<TagAutomation | null> {
  if (!tagId) throw new Error('tagId is required');
  return repo.getByTagId(tagId);
}

export async function saveTagAutomationUseCase(
  tagId: string,
  input: SaveTagAutomationInput,
  repo: ITagAutomationRepository,
): Promise<TagAutomation> {
  if (!tagId) throw new Error('tagId is required');
  SaveTagAutomationSchema.parse(input);
  return repo.save(tagId, input);
}

export async function deleteTagAutomationUseCase(
  tagId: string,
  repo: ITagAutomationRepository,
): Promise<void> {
  if (!tagId) throw new Error('tagId is required');
  return repo.delete(tagId);
}

/**
 * Executes all content assignments configured for a tag against a given athlete.
 * Runs all tasks in parallel. If any assignment fails, throws so the caller
 * can notify the user — other assignments that succeeded are kept.
 */
export async function executeTagAutomationUseCase(
  tagId: string,
  athleteId: string,
  autoRepo: ITagAutomationRepository,
  routineRepo: IRoutineRepository,
  cardioRepo: ICardioRepository,
  nutritionRepo: INutritionRepository,
): Promise<void> {
  if (!tagId) throw new Error('tagId is required');
  if (!athleteId) throw new Error('athleteId is required');

  const automation = await autoRepo.getByTagId(tagId);
  if (!automation) return;

  const tasks: Promise<void>[] = [];
  if (automation.routineId)       tasks.push(routineRepo.assignToAthlete(automation.routineId, athleteId));
  if (automation.cardioId)        tasks.push(cardioRepo.assignToAthlete(automation.cardioId, athleteId));
  if (automation.nutritionPlanId) tasks.push(nutritionRepo.assignToAthlete(automation.nutritionPlanId, athleteId));

  if (tasks.length === 0) return;

  const results = await Promise.allSettled(tasks);
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error('Alguna asignación automática ha fallado');
  }
}
