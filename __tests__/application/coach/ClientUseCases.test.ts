/**
 * ClientUseCases tests
 */

import {
  getCoachAthletesUseCase,
  getAthleteDetailUseCase,
  unassignRoutineFromAthleteUseCase,
} from '../../../src/application/coach/ClientUseCases';
import { ICoachRepository, CoachAthlete, AthleteRoutineAssignment, AthleteSession } from '../../../src/domain/repositories/ICoachRepository';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const ATHLETE_ID = 'athl-uuid-0001-0000-000000000001';
const ROUTINE_ID = 'rout-uuid-0001-0000-000000000001';
const NOW        = new Date();

const ATHLETE: CoachAthlete = { id: ATHLETE_ID, fullName: 'Ana García', email: 'ana@test.com' };

const ASSIGNMENT: AthleteRoutineAssignment = {
  routineId: ROUTINE_ID, routineName: 'Push A', assignedAt: NOW,
};

const SESSION: AthleteSession = {
  id: 'sess-001', startedAt: NOW, finishedAt: NOW, status: 'completed',
};

// ── Mock repo ─────────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<ICoachRepository> = {
  getAthletes:            jest.fn(),
  getAthleteAssignments:  jest.fn(),
  getAthleteSessions:     jest.fn(),
  unassignRoutine:        jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getCoachAthletesUseCase ───────────────────────────────────────────────────

describe('getCoachAthletesUseCase', () => {
  it('returns athletes for a valid coachId', async () => {
    mockRepo.getAthletes.mockResolvedValue([ATHLETE]);
    const result = await getCoachAthletesUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Ana García');
    expect(mockRepo.getAthletes).toHaveBeenCalledWith(COACH_ID);
  });

  it('returns empty array when coach has no athletes', async () => {
    mockRepo.getAthletes.mockResolvedValue([]);
    expect(await getCoachAthletesUseCase(COACH_ID, mockRepo)).toEqual([]);
  });

  it('throws when coachId is empty', async () => {
    await expect(getCoachAthletesUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getAthletes).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getAthletes.mockRejectedValue(new Error('DB error'));
    await expect(getCoachAthletesUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });
});

// ── getAthleteDetailUseCase ───────────────────────────────────────────────────

describe('getAthleteDetailUseCase', () => {
  it('returns assignments and sessions in parallel', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([ASSIGNMENT]);
    mockRepo.getAthleteSessions.mockResolvedValue([SESSION]);

    const result = await getAthleteDetailUseCase(ATHLETE_ID, mockRepo);

    expect(result.assignments).toHaveLength(1);
    expect(result.sessions).toHaveLength(1);
    expect(mockRepo.getAthleteAssignments).toHaveBeenCalledWith(ATHLETE_ID);
    expect(mockRepo.getAthleteSessions).toHaveBeenCalledWith(ATHLETE_ID, 10);
  });

  it('returns empty arrays when athlete has no data', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteSessions.mockResolvedValue([]);

    const result = await getAthleteDetailUseCase(ATHLETE_ID, mockRepo);
    expect(result.assignments).toEqual([]);
    expect(result.sessions).toEqual([]);
  });

  it('throws when athleteId is empty', async () => {
    await expect(getAthleteDetailUseCase('', mockRepo)).rejects.toThrow('athleteId is required');
    expect(mockRepo.getAthleteAssignments).not.toHaveBeenCalled();
  });

  it('propagates errors from getAthleteAssignments', async () => {
    mockRepo.getAthleteAssignments.mockRejectedValue(new Error('RLS error'));
    mockRepo.getAthleteSessions.mockResolvedValue([]);
    await expect(getAthleteDetailUseCase(ATHLETE_ID, mockRepo)).rejects.toThrow('RLS error');
  });

  it('propagates errors from getAthleteSessions', async () => {
    mockRepo.getAthleteAssignments.mockResolvedValue([]);
    mockRepo.getAthleteSessions.mockRejectedValue(new Error('Sessions error'));
    await expect(getAthleteDetailUseCase(ATHLETE_ID, mockRepo)).rejects.toThrow('Sessions error');
  });
});

// ── unassignRoutineFromAthleteUseCase ─────────────────────────────────────────

describe('unassignRoutineFromAthleteUseCase', () => {
  it('calls repository.unassignRoutine with correct ids', async () => {
    mockRepo.unassignRoutine.mockResolvedValue(undefined);
    await unassignRoutineFromAthleteUseCase(ROUTINE_ID, ATHLETE_ID, mockRepo);
    expect(mockRepo.unassignRoutine).toHaveBeenCalledWith(ROUTINE_ID, ATHLETE_ID);
  });

  it('throws when routineId is empty', async () => {
    await expect(unassignRoutineFromAthleteUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('routineId is required');
    expect(mockRepo.unassignRoutine).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(unassignRoutineFromAthleteUseCase(ROUTINE_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.unassignRoutine).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.unassignRoutine.mockRejectedValue(new Error('Delete failed'));
    await expect(unassignRoutineFromAthleteUseCase(ROUTINE_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('Delete failed');
  });
});
