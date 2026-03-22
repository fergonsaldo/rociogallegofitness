/**
 * Use cases for coach session calendar (RF-E8-01 + RF-E8-03).
 */

import { CoachSession, CreateCoachSessionInput } from '@/domain/entities/CoachSession';
import { ICoachSessionRepository } from '@/domain/repositories/ICoachSessionRepository';

export async function getSessionsForMonthUseCase(
  coachId: string,
  year: number,
  month: number,
  repo: ICoachSessionRepository,
): Promise<CoachSession[]> {
  if (!coachId) throw new Error('coachId is required');
  if (month < 1 || month > 12) throw new Error('month must be between 1 and 12');
  return repo.getForMonth(coachId, year, month);
}

export async function createSessionUseCase(
  input: CreateCoachSessionInput,
  repo: ICoachSessionRepository,
): Promise<CoachSession> {
  if (!input.coachId) throw new Error('coachId is required');
  if (!input.scheduledAt) throw new Error('scheduledAt is required');
  if (input.durationMinutes < 1) throw new Error('durationMinutes must be at least 1');

  const end = new Date(input.scheduledAt.getTime() + input.durationMinutes * 60_000);
  const overlapping = await repo.getOverlapping(input.coachId, input.scheduledAt, end);
  if (overlapping.length > 0) {
    throw new Error('La sesión se solapa con otra ya programada');
  }

  return repo.create(input);
}

export async function deleteSessionUseCase(
  id: string,
  repo: ICoachSessionRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}
