/**
 * CoachSessionUseCases tests
 */

import {
  getSessionsForMonthUseCase,
  getSessionsForRangeUseCase,
  createSessionUseCase,
  updateSessionUseCase,
  deleteSessionUseCase,
  computeMonthKpis,
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
  update:         jest.fn(),
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

  it('throws when scheduledAt is missing', async () => {
    await expect(createSessionUseCase({ ...CREATE_INPUT, scheduledAt: undefined as any }, mockRepo))
      .rejects.toThrow('scheduledAt is required');
    expect(mockRepo.getOverlapping).not.toHaveBeenCalled();
  });

  it('throws when durationMinutes is less than 1', async () => {
    await expect(createSessionUseCase({ ...CREATE_INPUT, durationMinutes: 0 }, mockRepo))
      .rejects.toThrow('durationMinutes must be at least 1');
    expect(mockRepo.getOverlapping).not.toHaveBeenCalled();
  });

  it('allows durationMinutes of exactly 1', async () => {
    mockRepo.getOverlapping.mockResolvedValue([]);
    mockRepo.create.mockResolvedValue(SESSION);
    await expect(createSessionUseCase({ ...CREATE_INPUT, durationMinutes: 1 }, mockRepo)).resolves.toBeDefined();
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

// ── updateSessionUseCase ──────────────────────────────────────────────────────

describe('updateSessionUseCase', () => {
  it('calls repo.update with id and input and returns updated session', async () => {
    const updated = { ...SESSION, title: 'Actualizado' };
    mockRepo.update.mockResolvedValue(updated);
    mockRepo.getOverlapping.mockResolvedValue([]);
    const result = await updateSessionUseCase(SESSION_ID, { title: 'Actualizado', scheduledAt: NOW }, COACH_ID, mockRepo);
    expect(result).toEqual(updated);
    expect(mockRepo.update).toHaveBeenCalledWith(SESSION_ID, expect.objectContaining({ title: 'Actualizado' }));
  });

  it('throws when id is empty', async () => {
    await expect(updateSessionUseCase('', { title: 'X' }, COACH_ID, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when coachId is empty', async () => {
    await expect(updateSessionUseCase(SESSION_ID, { title: 'X' }, '', mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when durationMinutes is 0', async () => {
    await expect(updateSessionUseCase(SESSION_ID, { durationMinutes: 0 }, COACH_ID, mockRepo))
      .rejects.toThrow();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('skips overlap check when scheduledAt is not in input', async () => {
    const updated = { ...SESSION, title: 'Solo título' };
    mockRepo.update.mockResolvedValue(updated);
    await updateSessionUseCase(SESSION_ID, { title: 'Solo título' }, COACH_ID, mockRepo);
    expect(mockRepo.getOverlapping).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it('runs overlap check when scheduledAt is provided and passes if only self overlaps', async () => {
    mockRepo.getOverlapping.mockResolvedValue([SESSION]); // only the same session
    mockRepo.update.mockResolvedValue(SESSION);
    await expect(
      updateSessionUseCase(SESSION_ID, { scheduledAt: NOW }, COACH_ID, mockRepo),
    ).resolves.not.toThrow();
  });

  it('throws overlap error when another session conflicts', async () => {
    const otherSession = { ...SESSION, id: 'other-id' };
    mockRepo.getOverlapping.mockResolvedValue([otherSession]);
    await expect(
      updateSessionUseCase(SESSION_ID, { scheduledAt: NOW }, COACH_ID, mockRepo),
    ).rejects.toThrow('La sesión se solapa con otra ya programada');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getOverlapping.mockResolvedValue([]);
    mockRepo.update.mockRejectedValue(new Error('Update failed'));
    await expect(
      updateSessionUseCase(SESSION_ID, { scheduledAt: NOW }, COACH_ID, mockRepo),
    ).rejects.toThrow('Update failed');
  });

  it('succeeds with empty input (no changes)', async () => {
    mockRepo.update.mockResolvedValue(SESSION);
    await expect(
      updateSessionUseCase(SESSION_ID, {}, COACH_ID, mockRepo),
    ).resolves.not.toThrow();
    expect(mockRepo.getOverlapping).not.toHaveBeenCalled();
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

// ── computeMonthKpis ──────────────────────────────────────────────────────────

describe('computeMonthKpis', () => {
  function makeSession(overrides: Partial<CoachSession> = {}): CoachSession {
    return { ...SESSION, ...overrides };
  }

  it('returns all zeros for an empty session list', () => {
    const kpis = computeMonthKpis([]);
    expect(kpis).toEqual({ totalSessions: 0, totalHours: 0, inPerson: 0, online: 0 });
  });

  it('counts total sessions correctly', () => {
    const sessions = [makeSession(), makeSession({ id: 's2' }), makeSession({ id: 's3' })];
    expect(computeMonthKpis(sessions).totalSessions).toBe(3);
  });

  it('sums durationMinutes and converts to hours (60 min = 1 h)', () => {
    const sessions = [
      makeSession({ durationMinutes: 60 }),
      makeSession({ id: 's2', durationMinutes: 60 }),
    ];
    expect(computeMonthKpis(sessions).totalHours).toBe(2);
  });

  it('rounds totalHours to one decimal place (90 min = 1.5 h)', () => {
    const sessions = [makeSession({ durationMinutes: 90 })];
    expect(computeMonthKpis(sessions).totalHours).toBe(1.5);
  });

  it('floors fractional hours to one decimal (100 min ≈ 1.7 h)', () => {
    const sessions = [makeSession({ durationMinutes: 100 })];
    expect(computeMonthKpis(sessions).totalHours).toBe(1.7);
  });

  it('counts in_person sessions', () => {
    const sessions = [
      makeSession({ modality: 'in_person' }),
      makeSession({ id: 's2', modality: 'in_person' }),
      makeSession({ id: 's3', modality: 'online' }),
    ];
    expect(computeMonthKpis(sessions).inPerson).toBe(2);
  });

  it('counts online sessions', () => {
    const sessions = [
      makeSession({ modality: 'online' }),
      makeSession({ id: 's2', modality: 'in_person' }),
    ];
    expect(computeMonthKpis(sessions).online).toBe(1);
  });

  it('handles a single in_person session', () => {
    const kpis = computeMonthKpis([makeSession({ modality: 'in_person', durationMinutes: 45 })]);
    expect(kpis.totalSessions).toBe(1);
    expect(kpis.totalHours).toBe(0.8);
    expect(kpis.inPerson).toBe(1);
    expect(kpis.online).toBe(0);
  });

  it('handles a single online session', () => {
    const kpis = computeMonthKpis([makeSession({ modality: 'online', durationMinutes: 30 })]);
    expect(kpis.online).toBe(1);
    expect(kpis.inPerson).toBe(0);
    expect(kpis.totalHours).toBe(0.5);
  });

  it('inPerson + online equals totalSessions when all sessions have known modality', () => {
    const sessions = [
      makeSession({ modality: 'in_person' }),
      makeSession({ id: 's2', modality: 'online' }),
      makeSession({ id: 's3', modality: 'in_person' }),
    ];
    const kpis = computeMonthKpis(sessions);
    expect(kpis.inPerson + kpis.online).toBe(kpis.totalSessions);
  });

  it('in_person sessions do not count toward online', () => {
    const sessions = [
      makeSession({ modality: 'in_person' }),
      makeSession({ id: 's2', modality: 'in_person' }),
    ];
    const kpis = computeMonthKpis(sessions);
    expect(kpis.online).toBe(0);
    expect(kpis.inPerson).toBe(2);
  });
});
