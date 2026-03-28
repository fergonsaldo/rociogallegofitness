/**
 * Use cases for session activity log (RF-E8-06).
 */

import {
  SessionActivityLog,
  CreateSessionActivityLogInput,
} from '@/domain/entities/SessionActivityLog';
import { ISessionActivityLogRepository } from '@/domain/repositories/ISessionActivityLogRepository';

export async function getSessionActivityUseCase(
  coachId: string,
  from: Date,
  to: Date,
  repo: ISessionActivityLogRepository,
): Promise<SessionActivityLog[]> {
  if (!coachId) throw new Error('coachId is required');
  if (from > to) throw new Error('from must be before or equal to to');
  return repo.getByCoachId(coachId, from, to);
}

export async function logSessionActivityUseCase(
  input: CreateSessionActivityLogInput,
  repo: ISessionActivityLogRepository,
): Promise<void> {
  if (!input.coachId)   throw new Error('coachId is required');
  if (!input.sessionId) throw new Error('sessionId is required');
  if (!input.action)    throw new Error('action is required');
  return repo.create(input);
}
