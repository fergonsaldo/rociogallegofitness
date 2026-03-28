/**
 * Use cases for coach session calendar (RF-E8-01 + RF-E8-03).
 */

import { CoachSession, CreateCoachSessionInput, UpdateCoachSessionInput, UpdateCoachSessionSchema } from '@/domain/entities/CoachSession';
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

export async function getSessionsForRangeUseCase(
  coachId: string,
  from: Date,
  to: Date,
  repo: ICoachSessionRepository,
): Promise<CoachSession[]> {
  if (!coachId) throw new Error('coachId is required');
  if (from >= to) throw new Error('from must be before to');
  return repo.getForRange(coachId, from, to);
}

export async function updateSessionUseCase(
  id: string,
  input: UpdateCoachSessionInput,
  coachId: string,
  repo: ICoachSessionRepository,
): Promise<CoachSession> {
  if (!id)      throw new Error('id is required');
  if (!coachId) throw new Error('coachId is required');
  UpdateCoachSessionSchema.parse(input);

  if (input.scheduledAt !== undefined) {
    const duration = input.durationMinutes ?? 60;
    const end = new Date(input.scheduledAt.getTime() + duration * 60_000);
    const overlapping = await repo.getOverlapping(coachId, input.scheduledAt, end);
    const conflicts = overlapping.filter((s) => s.id !== id);
    if (conflicts.length > 0) {
      throw new Error('La sesión se solapa con otra ya programada');
    }
  }

  return repo.update(id, input);
}

export async function deleteSessionUseCase(
  id: string,
  repo: ICoachSessionRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}

// ── RF-E8-07: KPIs de agenda ──────────────────────────────────────────────────

export interface MonthKpis {
  totalSessions: number;
  totalHours:    number;
  inPerson:      number;
  online:        number;
}

export function computeMonthKpis(sessions: CoachSession[]): MonthKpis {
  let totalMinutes = 0;
  let inPerson     = 0;
  let online       = 0;

  for (const s of sessions) {
    totalMinutes += s.durationMinutes;
    if      (s.modality === 'in_person') inPerson++;
    else if (s.modality === 'online')    online++;
  }

  return {
    totalSessions: sessions.length,
    totalHours:    Math.round((totalMinutes / 60) * 10) / 10,
    inPerson,
    online,
  };
}
