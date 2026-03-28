/**
 * ScheduleUseCases tests (RF-E8-04)
 */

import {
  getSchedulesUseCase,
  createScheduleUseCase,
  toggleScheduleActiveUseCase,
  deleteScheduleUseCase,
  calculateTotalSlots,
} from '../../../src/application/coach/ScheduleUseCases';
import { IScheduleRepository } from '../../../src/domain/repositories/IScheduleRepository';
import { Schedule } from '../../../src/domain/entities/Schedule';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const SCHEDULE_ID = 'sche-uuid-0001-0000-000000000001';

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id:                   SCHEDULE_ID,
    coachId:              COACH_ID,
    title:                'Mañanas',
    startDate:            new Date('2026-04-01'),
    endDate:              new Date('2026-04-30'),
    startTime:            '09:00',
    endTime:              '18:00',
    slotDurationMinutes:  60,
    modality:             'in_person',
    isActive:             true,
    createdAt:            new Date(),
    ...overrides,
  };
}

const SCHEDULE = makeSchedule();

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<IScheduleRepository> = {
  getByCoachId: jest.fn(),
  create:       jest.fn(),
  toggleActive: jest.fn(),
  delete:       jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── calculateTotalSlots ───────────────────────────────────────────────────────

describe('calculateTotalSlots', () => {
  it('calculates slots for a 1-day window with 60-min slots', () => {
    const s = makeSchedule({ startDate: new Date('2026-04-01'), endDate: new Date('2026-04-01'), startTime: '09:00', endTime: '18:00', slotDurationMinutes: 60 });
    // 9 hours × 1 slot/hour × 1 day = 9
    expect(calculateTotalSlots(s)).toBe(9);
  });

  it('calculates slots for a 2-day window with 30-min slots', () => {
    const s = makeSchedule({ startDate: new Date('2026-04-01'), endDate: new Date('2026-04-02'), startTime: '08:00', endTime: '10:00', slotDurationMinutes: 30 });
    // 2 hours × 2 slots/hour × 2 days = 8
    expect(calculateTotalSlots(s)).toBe(8);
  });

  it('returns 0 when slot duration exceeds available window', () => {
    const s = makeSchedule({ startTime: '09:00', endTime: '09:30', slotDurationMinutes: 60 });
    expect(calculateTotalSlots(s)).toBe(0);
  });

  it('returns 0 when endTime equals startTime', () => {
    const s = makeSchedule({ startTime: '09:00', endTime: '09:00', slotDurationMinutes: 30 });
    expect(calculateTotalSlots(s)).toBe(0);
  });

  it('handles partial slot — floors the result', () => {
    const s = makeSchedule({ startDate: new Date('2026-04-01'), endDate: new Date('2026-04-01'), startTime: '09:00', endTime: '10:50', slotDurationMinutes: 60 });
    // 110 min / 60 = 1.83 → floor = 1
    expect(calculateTotalSlots(s)).toBe(1);
  });

  it('counts start and end date as both inclusive', () => {
    const s = makeSchedule({ startDate: new Date('2026-04-01'), endDate: new Date('2026-04-03'), startTime: '09:00', endTime: '10:00', slotDurationMinutes: 60 });
    // 1 slot/day × 3 days = 3
    expect(calculateTotalSlots(s)).toBe(3);
  });

  it('accounts for non-zero start minutes (09:30 to 11:00 = 90 min → 1 slot of 60)', () => {
    const s = makeSchedule({ startDate: new Date('2026-04-01'), endDate: new Date('2026-04-01'), startTime: '09:30', endTime: '11:00', slotDurationMinutes: 60 });
    // (11*60) - (9*60+30) = 660 - 570 = 90 min / 60 = 1 slot
    expect(calculateTotalSlots(s)).toBe(1);
  });
});

// ── getSchedulesUseCase ───────────────────────────────────────────────────────

describe('getSchedulesUseCase', () => {
  it('returns schedules for a valid coachId', async () => {
    mockRepo.getByCoachId.mockResolvedValue([SCHEDULE]);
    const result = await getSchedulesUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Mañanas');
    expect(mockRepo.getByCoachId).toHaveBeenCalledWith(COACH_ID);
  });

  it('returns empty array when coach has no schedules', async () => {
    mockRepo.getByCoachId.mockResolvedValue([]);
    expect(await getSchedulesUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getSchedulesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getByCoachId).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getByCoachId.mockRejectedValue(new Error('DB error'));
    await expect(getSchedulesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createScheduleUseCase ─────────────────────────────────────────────────────

describe('createScheduleUseCase', () => {
  const validInput = {
    coachId:             COACH_ID,
    title:               'Mañanas',
    startDate:           new Date('2026-04-01'),
    endDate:             new Date('2026-04-30'),
    startTime:           '09:00',
    endTime:             '18:00',
    slotDurationMinutes: 60,
    modality:            'in_person' as const,
    isActive:            true,
  };

  it('creates a schedule and returns it', async () => {
    mockRepo.create.mockResolvedValue(SCHEDULE);
    const result = await createScheduleUseCase(validInput, mockRepo);
    expect(result.title).toBe('Mañanas');
    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Mañanas' }));
  });

  it('trims whitespace from title', async () => {
    mockRepo.create.mockResolvedValue(SCHEDULE);
    await createScheduleUseCase({ ...validInput, title: '  Mañanas  ' }, mockRepo);
    expect(mockRepo.create.mock.calls[0][0].title).toBe('Mañanas');
  });

  it('throws when coachId is empty', async () => {
    await expect(createScheduleUseCase({ ...validInput, coachId: '' }, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when title is empty', async () => {
    await expect(createScheduleUseCase({ ...validInput, title: '' }, mockRepo))
      .rejects.toThrow('title is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when title is only whitespace', async () => {
    await expect(createScheduleUseCase({ ...validInput, title: '   ' }, mockRepo))
      .rejects.toThrow('title is required');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when endDate is before startDate', async () => {
    await expect(createScheduleUseCase({
      ...validInput,
      startDate: new Date('2026-04-30'),
      endDate:   new Date('2026-04-01'),
    }, mockRepo)).rejects.toThrow('La fecha de fin debe ser igual o posterior a la de inicio');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('allows endDate equal to startDate', async () => {
    mockRepo.create.mockResolvedValue(SCHEDULE);
    await expect(createScheduleUseCase({
      ...validInput,
      startDate: new Date('2026-04-01'),
      endDate:   new Date('2026-04-01'),
    }, mockRepo)).resolves.toBeDefined();
  });

  it('throws when endTime is before startTime', async () => {
    await expect(createScheduleUseCase({ ...validInput, startTime: '18:00', endTime: '09:00' }, mockRepo))
      .rejects.toThrow('La hora de fin debe ser posterior a la de inicio');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when endTime equals startTime', async () => {
    await expect(createScheduleUseCase({ ...validInput, startTime: '09:00', endTime: '09:00' }, mockRepo))
      .rejects.toThrow('La hora de fin debe ser posterior a la de inicio');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('Insert failed'));
    await expect(createScheduleUseCase(validInput, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── toggleScheduleActiveUseCase ───────────────────────────────────────────────

describe('toggleScheduleActiveUseCase', () => {
  it('calls toggleActive with id and isActive=false', async () => {
    const deactivated = makeSchedule({ isActive: false });
    mockRepo.toggleActive.mockResolvedValue(deactivated);
    const result = await toggleScheduleActiveUseCase(SCHEDULE_ID, false, mockRepo);
    expect(result.isActive).toBe(false);
    expect(mockRepo.toggleActive).toHaveBeenCalledWith(SCHEDULE_ID, false);
  });

  it('calls toggleActive with id and isActive=true', async () => {
    mockRepo.toggleActive.mockResolvedValue(SCHEDULE);
    const result = await toggleScheduleActiveUseCase(SCHEDULE_ID, true, mockRepo);
    expect(result.isActive).toBe(true);
  });

  it('throws when id is empty', async () => {
    await expect(toggleScheduleActiveUseCase('', true, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.toggleActive).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.toggleActive.mockRejectedValue(new Error('RLS error'));
    await expect(toggleScheduleActiveUseCase(SCHEDULE_ID, false, mockRepo))
      .rejects.toThrow('RLS error');
  });
});

// ── deleteScheduleUseCase ─────────────────────────────────────────────────────

describe('deleteScheduleUseCase', () => {
  it('calls repository.delete with the schedule id', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await deleteScheduleUseCase(SCHEDULE_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(SCHEDULE_ID);
  });

  it('throws when id is empty', async () => {
    await expect(deleteScheduleUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteScheduleUseCase(SCHEDULE_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});
