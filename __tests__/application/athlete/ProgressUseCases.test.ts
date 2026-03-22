import {
  getWorkoutHistoryUseCase,
  getExerciseProgressionUseCase,
  getPersonalBestsUseCase,
  saveProgressRecordsUseCase,
} from '../../../src/application/athlete/ProgressUseCases';
import { IWorkoutRepository } from '../../../src/domain/repositories/IWorkoutRepository';
import { IProgressRepository } from '../../../src/domain/repositories/IProgressRepository';
import { WorkoutSession } from '../../../src/domain/entities/WorkoutSession';
import { ProgressRecord } from '../../../src/domain/entities/ProgressRecord';
import { ExerciseSet } from '../../../src/domain/entities/ExerciseSet';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const UUID       = '123e4567-e89b-12d3-a456-426614174000';
const ATHLETE_ID = '223e4567-e89b-12d3-a456-426614174001';
const EXERCISE_A = '11111111-0001-0000-0000-000000000001';
const EXERCISE_B = '11111111-0002-0000-0000-000000000002';
const NOW = new Date('2024-06-01T10:00:00Z');
const LATER = new Date('2024-06-01T11:30:00Z');

const makeSet = (exerciseId: string, weightKg: number, reps: number, n: number): ExerciseSet => ({
  id: `set-${n}`, sessionId: UUID, exerciseId,
  setNumber: n, performance: { type: 'reps', reps, weightKg },
  restAfterSeconds: 90, completedAt: NOW,
});

const SESSION_WITH_SETS: WorkoutSession = {
  id: UUID, athleteId: ATHLETE_ID, status: 'completed',
  startedAt: NOW, finishedAt: LATER,
  sets: [
    makeSet(EXERCISE_A, 100, 10, 1), // vol 1000
    makeSet(EXERCISE_A, 105, 8,  2), // vol 840
    makeSet(EXERCISE_B, 60,  12, 3), // vol 720
  ],
};

const PROGRESS_RECORD: ProgressRecord = {
  id: UUID, athleteId: ATHLETE_ID, exerciseId: EXERCISE_A, sessionId: UUID,
  recordedAt: NOW, bestWeightKg: 105, bestReps: 8,
  estimatedOneRepMaxKg: 140, totalVolumeKg: 1840,
};

// ── Mock repos ────────────────────────────────────────────────────────────────
const mockWorkoutRepo: jest.Mocked<IWorkoutRepository> = {
  startSession: jest.fn(), getActiveSession: jest.fn(),
  getSessionById: jest.fn(), getSessionHistory: jest.fn(),
  logSet: jest.fn(), finishSession: jest.fn(),
  abandonSession: jest.fn(), markSynced: jest.fn(),
  getUnsyncedSessions: jest.fn(),
};

const mockProgressRepo: jest.Mocked<IProgressRepository> = {
  create: jest.fn(),
  getByAthleteAndExercise: jest.fn(),
  getLatestPerExercise: jest.fn(),
  getPersonalBest: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getWorkoutHistoryUseCase ──────────────────────────────────────────────────
describe('getWorkoutHistoryUseCase', () => {
  it('computes volume, sets, duration and exercise count from session sets', async () => {
    mockWorkoutRepo.getSessionHistory.mockResolvedValue([SESSION_WITH_SETS]);
    const result = await getWorkoutHistoryUseCase(ATHLETE_ID, mockWorkoutRepo);

    expect(result).toHaveLength(1);
    expect(result[0].totalVolumeKg).toBe(1000 + 840 + 720); // 2560
    expect(result[0].totalSets).toBe(3);
    expect(result[0].exerciseCount).toBe(2);
    expect(result[0].durationMinutes).toBe(90);
  });

  it('returns empty array when no sessions exist', async () => {
    mockWorkoutRepo.getSessionHistory.mockResolvedValue([]);
    const result = await getWorkoutHistoryUseCase(ATHLETE_ID, mockWorkoutRepo);
    expect(result).toHaveLength(0);
  });

  it('throws when athleteId is empty', async () => {
    await expect(getWorkoutHistoryUseCase('', mockWorkoutRepo)).rejects.toThrow('athleteId is required');
  });
});

// ── getExerciseProgressionUseCase ─────────────────────────────────────────────
describe('getExerciseProgressionUseCase', () => {
  it('maps progress records to progression points', async () => {
    mockProgressRepo.getByAthleteAndExercise.mockResolvedValue([PROGRESS_RECORD]);
    const result = await getExerciseProgressionUseCase(ATHLETE_ID, EXERCISE_A, mockProgressRepo);

    expect(result).toHaveLength(1);
    expect(result[0].estimatedOneRepMaxKg).toBe(140);
    expect(result[0].totalVolumeKg).toBe(1840);
  });

  it('throws when exerciseId is empty', async () => {
    await expect(
      getExerciseProgressionUseCase(ATHLETE_ID, '', mockProgressRepo)
    ).rejects.toThrow('exerciseId is required');
  });
});

// ── getPersonalBestsUseCase ───────────────────────────────────────────────────
describe('getPersonalBestsUseCase', () => {
  it('returns one snapshot per exercise with the best values', async () => {
    mockProgressRepo.getLatestPerExercise.mockResolvedValue([PROGRESS_RECORD]);
    const result = await getPersonalBestsUseCase(ATHLETE_ID, mockProgressRepo);

    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe(EXERCISE_A);
    expect(result[0].estimatedOneRepMaxKg).toBe(140);
  });
});

// ── saveProgressRecordsUseCase ────────────────────────────────────────────────
describe('saveProgressRecordsUseCase', () => {
  it('creates one record per unique exercise in the session', async () => {
    mockProgressRepo.create.mockResolvedValue(PROGRESS_RECORD);
    const result = await saveProgressRecordsUseCase(SESSION_WITH_SETS, mockProgressRepo);

    // 2 unique exercises → 2 create calls
    expect(mockProgressRepo.create).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('picks the heaviest set as the best weight for 1RM estimation', async () => {
    mockProgressRepo.create.mockResolvedValue(PROGRESS_RECORD);
    await saveProgressRecordsUseCase(SESSION_WITH_SETS, mockProgressRepo);

    const exerciseACall = mockProgressRepo.create.mock.calls.find(
      ([input]) => input.exerciseId === EXERCISE_A
    );
    expect(exerciseACall).toBeDefined();
    expect(exerciseACall![0].bestWeightKg).toBe(105); // 105 > 100
  });

  it('computes total volume correctly for an exercise', async () => {
    mockProgressRepo.create.mockResolvedValue(PROGRESS_RECORD);
    await saveProgressRecordsUseCase(SESSION_WITH_SETS, mockProgressRepo);

    const exerciseACall = mockProgressRepo.create.mock.calls.find(
      ([input]) => input.exerciseId === EXERCISE_A
    );
    expect(exerciseACall![0].totalVolumeKg).toBe(1840); // 100×10 + 105×8
  });

  it('throws when session is not completed', async () => {
    const activeSession: WorkoutSession = { ...SESSION_WITH_SETS, status: 'active', finishedAt: undefined };
    await expect(
      saveProgressRecordsUseCase(activeSession, mockProgressRepo)
    ).rejects.toThrow('completed sessions');
  });
});

// ── Additional branch coverage ────────────────────────────────────────────────

describe('getWorkoutHistoryUseCase (isometric sets)', () => {
  it('handles sessions with only isometric sets (no reps performance)', async () => {
    const isoSession = {
      ...SESSION_WITH_SETS,
      sets: [{
        id: 'set-iso-1', sessionId: SESSION_WITH_SETS.id, exerciseId: EXERCISE_A,
        setNumber: 1,
        performance: { type: 'isometric' as const, durationSeconds: 30 },
        completedAt: new Date(),
      }],
    };
    mockWorkoutRepo.getSessionHistory.mockResolvedValue([isoSession]);
    const result = await getWorkoutHistoryUseCase(ATHLETE_ID, mockWorkoutRepo);
    expect(result[0].totalVolumeKg).toBe(0);
    expect(result[0].totalSets).toBe(1);
  });

  it('returns durationMinutes as 0 when session has no finishedAt', async () => {
    const activeSession = { ...SESSION_WITH_SETS, finishedAt: undefined };
    mockWorkoutRepo.getSessionHistory.mockResolvedValue([activeSession]);
    const result = await getWorkoutHistoryUseCase(ATHLETE_ID, mockWorkoutRepo);
    expect(result[0].durationMinutes).toBe(0);
  });
});

describe('saveProgressRecordsUseCase (edge cases)', () => {
  it('skips 1RM estimation when reps exceed 36', async () => {
    const heavyRepsSession = {
      ...SESSION_WITH_SETS,
      status: 'completed' as const,
      sets: [{
        id: 'set-heavy', sessionId: SESSION_WITH_SETS.id, exerciseId: EXERCISE_A,
        setNumber: 1,
        performance: { type: 'reps' as const, reps: 40, weightKg: 20 },
        completedAt: new Date(),
      }],
    };
    mockProgressRepo.create.mockResolvedValue({
      id: 'rec-1', athleteId: ATHLETE_ID, exerciseId: EXERCISE_A,
      sessionId: SESSION_WITH_SETS.id, recordedAt: new Date(),
      totalVolumeKg: 800, bestWeightKg: 20, bestReps: 40,
      estimatedOneRepMaxKg: undefined,
    });
    const records = await saveProgressRecordsUseCase(heavyRepsSession, mockProgressRepo);
    // estimatedOneRepMaxKg should be undefined since reps > 36
    expect(mockProgressRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ estimatedOneRepMaxKg: undefined })
    );
    expect(records).toHaveLength(1);
  });

  it('handles session with only isometric sets (no reps sets)', async () => {
    const isoSession = {
      ...SESSION_WITH_SETS,
      status: 'completed' as const,
      sets: [{
        id: 'set-iso', sessionId: SESSION_WITH_SETS.id, exerciseId: EXERCISE_A,
        setNumber: 1,
        performance: { type: 'isometric' as const, durationSeconds: 60 },
        completedAt: new Date(),
      }],
    };
    mockProgressRepo.create.mockResolvedValue({
      id: 'rec-1', athleteId: ATHLETE_ID, exerciseId: EXERCISE_A,
      sessionId: SESSION_WITH_SETS.id, recordedAt: new Date(),
      totalVolumeKg: 0,
    });
    await saveProgressRecordsUseCase(isoSession, mockProgressRepo);
    expect(mockProgressRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ totalVolumeKg: 0, bestWeightKg: undefined })
    );
  });
});

// ── Branch coverage ───────────────────────────────────────────────────────────

describe('getWorkoutHistoryUseCase (branch coverage)', () => {
  it('computes durationMinutes correctly when finishedAt is defined', async () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const finish = new Date('2026-01-01T11:00:00Z');
    const session = { ...SESSION_WITH_SETS, startedAt: start, finishedAt: finish };
    mockWorkoutRepo.getSessionHistory.mockResolvedValue([session]);
    const result = await getWorkoutHistoryUseCase(ATHLETE_ID, mockWorkoutRepo);
    expect(result[0].durationMinutes).toBe(60);
  });

  it('throws when athleteId is empty', async () => {
    await expect(getWorkoutHistoryUseCase('', mockWorkoutRepo)).rejects.toThrow();
  });
});

describe('getPersonalBestsUseCase (branch coverage)', () => {
  it('throws when athleteId is empty', async () => {
    await expect(getPersonalBestsUseCase('', mockProgressRepo)).rejects.toThrow();
  });
});

describe('saveProgressRecordsUseCase (branch coverage)', () => {
  it('uses startedAt as recordedAt when finishedAt is undefined', async () => {
    const sessionNoFinish = {
      ...SESSION_WITH_SETS,
      status: 'completed' as const,
      finishedAt: undefined,
    };
    mockProgressRepo.create.mockResolvedValue({
      id: 'rec-1', athleteId: ATHLETE_ID, exerciseId: EXERCISE_A,
      sessionId: SESSION_WITH_SETS.id, recordedAt: new Date(),
      totalVolumeKg: 100, bestWeightKg: 100, bestReps: 10,
      estimatedOneRepMaxKg: 133,
    });
    await saveProgressRecordsUseCase(sessionNoFinish, mockProgressRepo);
    expect(mockProgressRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ recordedAt: sessionNoFinish.startedAt })
    );
  });
});
