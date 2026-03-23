/**
 * CoachSessionUseCases tests
 */

import {
  getSessionsForMonthUseCase,
  getSessionsForRangeUseCase,
  createSessionUseCase,
  deleteSessionUseCase,
} from '../../../src/application/coach/CoachSessionUseCases';
import { ICoachSessionRepository } from '../../../src/domain/repositories/ICoachSessionRepository';
import { CoachSession, CreateCoachSessionInput } from '../../../src/domain/entities/CoachSession';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const SESSION_ID = 'sess-uuid-0001-0000-000000000001';
const NOW        = new Date('2026-03-22T10:00:00.000Z');

const SESSION: CoachSession = {
  id:              SESSION_ID,
  coachId:         COACH_ID,
  athleteId:       null,
  athleteName:     null,
  title:           'Sesión de fuerza',
  sessionType:     'Entrenamiento',
  modality:        'in_person',
  scheduledAt:     NOW,
  durationMinutes: 60,
  notes:           null,
  createdAt:       NOW,
};

const CREATE_INPUT: CreateCoachSessionInput = {
  coachId:         COACH_ID,
  athleteId:       null,
  title:           'Sesión de fuerza',
  sessionType:     'Entrenamiento',
  modality:        'in_person',
  scheduledAt:     NOW,
  durationMinutes: 60,
  notes:           null,
};

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<ICoachSessionRepository> = {
  getForMonth:    jest.fn(),
  getForRange:    jest.fn(),
  getOverlapping: jest.fn(),
  create:         jest.fn(),
  delete:         jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getSessionsForMonthUseCase ────────────────────────────────────────────────

describe('getSessionsForMonthUseCase', () => {
  it('returns sessions for a valid coachId and month', async () => {
    mockRepo.getForMonth.mockResolvedValue([SESSION]);
    const result = await getSessionsForMonthUseCase(COACH_ID, 2026, 3, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(SESSION_ID);
    expect(mockRepo.getForMonth).toHaveBeenCalledWith(COACH_ID, 2026, 3);
  });

  it('returns empty array when no sessions exist', async () => {
    mockRepo.getForMonth.mockResolvedValue([]);
    expect(await getSessionsForMonthUseCase(COACH_ID, 2026, 3, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getSessionsForMonthUseCase('', 2026, 3, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.getForMonth).not.toHaveBeenCalled();
  });

  it('throws when month is less than 1', async () => {
    await expect(getSessionsForMonthUseCase(COACH_ID, 2026, 0, mockRepo))
      .rejects.toThrow('month must be between 1 and 12');
    expect(mockRepo.getForMonth).not.toHaveBeenCalled();
  });

  it('throws when month is greater than 12', async () => {
    await expect(getSessionsForMonthUseCase(COACH_ID, 2026, 13, mockRepo))
      .rejects.toThrow('month must be between 1 and 12');
    expect(mockRepo.getForMonth).not.toHaveBeenCalled();
  });

  it('accepts boundary months 1 and 12', async () => {
    mockRepo.getForMonth.mockResolvedValue([]);
    await expect(getSessionsForMonthUseCase(COACH_ID, 2026, 1, mockRepo)).resolves.toEqual([]);
    await expect(getSessionsForMonthUseCase(COACH_ID, 2026, 12, mockRepo)).resolves.toEqual([]);
  });

  it('propagates repository errors', async () => {
    mockRepo.getForMonth.mockRejectedValue(new Error('DB error'));
    await expect(getSessionsForMonthUseCase(COACH_ID, 2026, 3, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── createSessionUseCase ──────────────────────────────────────────────────────

describe('createSessionUseCase', () => {
  it('creates session when no overlap exists', async () => {
    mockRepo.getOverlapping.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue(SESSION);
    const result = await createSessionUseCase(CREATE_INPUT, mockRepo);
    expect(result.id).toBe(SESSION_ID);
    expect(mockRepo.create).toHaveBeenCalledWith(CREATE_INPUT);
  });

  it('calls getOverlapping with correct start and end times', async () => {
    mockRepo.getOverlapping.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue(SESSION);
    await createSessionUseCase(CREATE_INPUT, mockRepo);
    const expectedEnd = new Date(NOW.getTime() + 60 * 60_000);
    expect(mockRepo.getOverlapping).toHaveBeenCalledWith(COACH_ID, NOW, expectedEnd);
  });

  it('throws when overlap exists', async () => {
    mockRepo.getOverlapping.mockResolvedValue([SESSION]);
    await expect(createSessionUseCase(CREATE_INPUT, mockRepo))
      .rejects.toThrow('La sesión se solapa con otra ya programada');
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when coachId is empty', async () => {
    await expect(createSessionUseCase({ ...CREATE_INPUT, coachId: '' }, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.getOverlapping).not.toHaveBeenCalled();
  });

  it('throws when durationMinutes is less than 1', async () => {
    await expect(createSessionUseCase({ ...CREATE_INPUT, durationMinutes: 0 }, mockRepo))
      .rejects.toThrow('durationMinutes must be at least 1');
    expect(mockRepo.getOverlapping).not.toHaveBeenCalled();
  });

  it('propagates errors from getOverlapping', async () => {
    mockRepo.getOverlapping.mockRejectedValue(new Error('RLS error'));
    await expect(createSessionUseCase(CREATE_INPUT, mockRepo)).rejects.toThrow('RLS error');
  });

  it('propagates errors from create', async () => {
    mockRepo.getOverlapping.mockResolvedValue([]);
    mockRepo.create.mockRejectedValue(new Error('Insert failed'));
    await expect(createSessionUseCase(CREATE_INPUT, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── deleteSessionUseCase ──────────────────────────────────────────────────────

describe('deleteSessionUseCase', () => {
  it('calls repository.delete with the session id', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await deleteSessionUseCase(SESSION_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(SESSION_ID);
  });

  it('throws when id is empty', async () => {
    await expect(deleteSessionUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Delete failed'));
    await expect(deleteSessionUseCase(SESSION_ID, mockRepo)).rejects.toThrow('Delete failed');
  });
});

// ── getSessionsForRangeUseCase ────────────────────────────────────────────────

describe('getSessionsForRangeUseCase', () => {
  const FROM = new Date('2026-03-01T00:00:00Z');
  const TO   = new Date('2026-04-01T00:00:00Z');

  it('returns sessions for a valid range', async () => {
    mockRepo.getForRange.mockResolvedValue([SESSION]);
    const result = await getSessionsForRangeUseCase(COACH_ID, FROM, TO, mockRepo);
    expect(result).toHaveLength(1);
    expect(mockRepo.getForRange).toHaveBeenCalledWith(COACH_ID, FROM, TO);
  });

  it('returns empty array when no sessions', async () => {
    mockRepo.getForRange.mockResolvedValue([]);
    expect(await getSessionsForRangeUseCase(COACH_ID, FROM, TO, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getSessionsForRangeUseCase('', FROM, TO, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.getForRange).not.toHaveBeenCalled();
  });

  it('throws when from is equal to to', async () => {
    await expect(getSessionsForRangeUseCase(COACH_ID, FROM, FROM, mockRepo))
      .rejects.toThrow('from must be before to');
    expect(mockRepo.getForRange).not.toHaveBeenCalled();
  });

  it('throws when from is after to', async () => {
    await expect(getSessionsForRangeUseCase(COACH_ID, TO, FROM, mockRepo))
      .rejects.toThrow('from must be before to');
    expect(mockRepo.getForRange).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getForRange.mockRejectedValue(new Error('DB error'));
    await expect(getSessionsForRangeUseCase(COACH_ID, FROM, TO, mockRepo))
      .rejects.toThrow('DB error');
  });
});
