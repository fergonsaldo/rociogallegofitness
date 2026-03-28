/**
 * Use cases for coach schedule management (RF-E8-04).
 */

import { Schedule, CreateScheduleInput } from '@/domain/entities/Schedule';
import { IScheduleRepository } from '@/domain/repositories/IScheduleRepository';

/** Returns total bookable slots: days in range × slots per day. */
export function calculateTotalSlots(schedule: Schedule): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.floor(
    (schedule.endDate.getTime() - schedule.startDate.getTime()) / msPerDay,
  ) + 1;

  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH,   endM]   = schedule.endTime.split(':').map(Number);
  const availableMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  const slotsPerDay = Math.floor(availableMinutes / schedule.slotDurationMinutes);

  return Math.max(0, days * Math.max(0, slotsPerDay));
}

export async function getSchedulesUseCase(
  coachId: string,
  repo: IScheduleRepository,
): Promise<Schedule[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

export async function createScheduleUseCase(
  input: CreateScheduleInput,
  repo: IScheduleRepository,
): Promise<Schedule> {
  if (!input.coachId) throw new Error('coachId is required');
  if (!input.title.trim()) throw new Error('title is required');
  if (input.endDate < input.startDate) {
    throw new Error('La fecha de fin debe ser igual o posterior a la de inicio');
  }
  if (input.endTime <= input.startTime) {
    throw new Error('La hora de fin debe ser posterior a la de inicio');
  }
  return repo.create({ ...input, title: input.title.trim() });
}

export async function toggleScheduleActiveUseCase(
  id: string,
  isActive: boolean,
  repo: IScheduleRepository,
): Promise<Schedule> {
  if (!id) throw new Error('id is required');
  return repo.toggleActive(id, isActive);
}

export async function deleteScheduleUseCase(
  id: string,
  repo: IScheduleRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}
