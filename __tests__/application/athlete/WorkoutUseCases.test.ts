import {
  startWorkoutSessionUseCase,
  logExerciseSetUseCase,
  finishWorkoutSessionUseCase,
  abandonWorkoutSessionUseCase,
} from '../../../src/application/athlete/WorkoutUseCases';
import { IWorkoutRepository } from '../../../src/domain/repositories/IWorkoutRepository';
import { WorkoutSession } from '../../../src/domain/entities/WorkoutSession';
import { ExerciseSet } from '../../../src/domain/entities/ExerciseSet';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const UUID = '123e4567-e89b-12d3-a456-426614174000';
const ATHLETE_ID = '223e4567-e89b-12d3-a456-426614174001';
const EXERCISE_ID = '11111111-0001-0000-0000-000000000001';
const NOW = new Date();

const ACTIVE_SESSION: WorkoutSession = {
  id: UUID, athleteId: ATHLETE_ID, status: 'active',
  sets: [], startedAt: NOW,
};

const REPS_SET: ExerciseSet = {
  id: UUID, sessionId: UUID, exerciseId: EXERCISE_ID,
  setNumber: 1, performance: { type: 'reps', reps: 10, weightKg: 100 },
  restAfterSeconds: 90, completedAt: NOW,
};

// ── Mock repository ───────────────────────────────────────────────────────────
const mockRepo: jest.Mocked<IWorkoutRepository> = {
  startSession: jest.fn(),
  getActiveSession: jest.fn(),
  getSessionById: jest.fn(),
  getSessionHistory: jest.fn(),
  logSet: jest.fn(),
  finishSession: jest.fn(),
  abandonSession: jest.fn(),
  markSynced: jest.fn(),
  getUnsyncedSessions: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── startWorkoutSessionUseCase ────────────────────────────────────────────────
describe('startWorkoutSessionUseCase', () => {
  it('creates and returns a new session when no active session exists', async () => {
    mockRepo.getActiveSession.mockResolvedValue(null);
    mockRepo.startSession.mockResolvedValue(ACTIVE_SESSION);

    const result = await startWorkoutSessionUseCase({ athleteId: ATHLETE_ID }, mockRepo);
    expect(result.status).toBe('active');
    expect(mockRepo.startSession).toHaveBeenCalledTimes(1);
  });

  it('throws when athlete already has an active session', async () => {
    mockRepo.getActiveSession.mockResolvedValue(ACTIVE_SESSION);

    await expect(
      startWorkoutSessionUseCase({ athleteId: ATHLETE_ID }, mockRepo)
    ).rejects.toThrow('already have an active workout session');

    expect(mockRepo.startSession).not.toHaveBeenCalled();
  });

  it('throws a validation error when athleteId is not a UUID', async () => {
    await expect(
      startWorkoutSessionUseCase({ athleteId: 'not-a-uuid' }, mockRepo)
    ).rejects.toThrow();
    expect(mockRepo.getActiveSession).not.toHaveBeenCalled();
  });
});

// ── logExerciseSetUseCase ─────────────────────────────────────────────────────
describe('logExerciseSetUseCase', () => {
  const VALID_LOG = {
    sessionId: UUID,
    exerciseId: EXERCISE_ID,
    performance: { type: 'reps' as const, reps: 10, weightKg: 100 },
    restAfterSeconds: 90,
  };

  it('logs a reps set and returns it with the correct set number', async () => {
    mockRepo.getSessionById.mockResolvedValue(ACTIVE_SESSION);
    mockRepo.logSet.mockResolvedValue(REPS_SET);

    const result = await logExerciseSetUseCase(VALID_LOG, mockRepo);
    expect(result.setNumber).toBe(1);
    expect(mockRepo.logSet).toHaveBeenCalledWith({ ...VALID_LOG, setNumber: 1 });
  });

  it('increments set number for subsequent sets on the same exercise', async () => {
    const sessionWithOneSet: WorkoutSession = { ...ACTIVE_SESSION, sets: [REPS_SET] };
    mockRepo.getSessionById.mockResolvedValue(sessionWithOneSet);
    mockRepo.logSet.mockResolvedValue({ ...REPS_SET, setNumber: 2 });

    await logExerciseSetUseCase(VALID_LOG, mockRepo);
    expect(mockRepo.logSet).toHaveBeenCalledWith(expect.objectContaining({ setNumber: 2 }));
  });

  it('logs an isometric set correctly', async () => {
    mockRepo.getSessionById.mockResolvedValue(ACTIVE_SESSION);
    const isoSet: ExerciseSet = { ...REPS_SET, performance: { type: 'isometric', durationSeconds: 60 } };
    mockRepo.logSet.mockResolvedValue(isoSet);

    const result = await logExerciseSetUseCase({
      ...VALID_LOG, performance: { type: 'isometric', durationSeconds: 60 },
    }, mockRepo);
    expect(result.performance.type).toBe('isometric');
  });

  it('throws when session is not active', async () => {
    const completed: WorkoutSession = { ...ACTIVE_SESSION, status: 'completed', finishedAt: NOW };
    mockRepo.getSessionById.mockResolvedValue(completed);

    await expect(logExerciseSetUseCase(VALID_LOG, mockRepo))
      .rejects.toThrow('not active');
  });

  it('throws when reps is 0', async () => {
    await expect(
      logExerciseSetUseCase({ ...VALID_LOG, performance: { type: 'reps', reps: 0, weightKg: 100 } }, mockRepo)
    ).rejects.toThrow();
    expect(mockRepo.getSessionById).not.toHaveBeenCalled();
  });
});

// ── finishWorkoutSessionUseCase ───────────────────────────────────────────────
describe('finishWorkoutSessionUseCase', () => {
  it('returns a summary with correct volume calculation', async () => {
    const sessionWithSets: WorkoutSession = {
      ...ACTIVE_SESSION,
      sets: [
        { ...REPS_SET, performance: { type: 'reps', reps: 10, weightKg: 100 } },   // 1000
        { ...REPS_SET, id: 'set2', setNumber: 2, performance: { type: 'reps', reps: 8, weightKg: 105 } }, // 840
      ],
    };
    const finishedSession: WorkoutSession = { ...sessionWithSets, status: 'completed', finishedAt: NOW };
    mockRepo.getSessionById.mockResolvedValue(sessionWithSets);
    mockRepo.finishSession.mockResolvedValue(finishedSession);

    const summary = await finishWorkoutSessionUseCase(UUID, mockRepo);
    expect(summary.totalVolumeKg).toBe(1840);
    expect(summary.totalSets).toBe(2);
  });

  it('throws when session is already completed', async () => {
    const completed: WorkoutSession = { ...ACTIVE_SESSION, status: 'completed', finishedAt: NOW };
    mockRepo.getSessionById.mockResolvedValue(completed);

    await expect(finishWorkoutSessionUseCase(UUID, mockRepo))
      .rejects.toThrow('not active');
  });

  it('throws when sessionId is empty', async () => {
    await expect(finishWorkoutSessionUseCase('', mockRepo)).rejects.toThrow('sessionId is required');
  });
});

// ── abandonWorkoutSessionUseCase ──────────────────────────────────────────────
describe('abandonWorkoutSessionUseCase', () => {
  it('calls repository.abandonSession for an active session', async () => {
    mockRepo.getSessionById.mockResolvedValue(ACTIVE_SESSION);
    mockRepo.abandonSession.mockResolvedValue({ ...ACTIVE_SESSION, status: 'abandoned' });

    await abandonWorkoutSessionUseCase(UUID, mockRepo);
    expect(mockRepo.abandonSession).toHaveBeenCalledWith(UUID);
  });

  it('throws when sessionId is empty', async () => {
    await expect(abandonWorkoutSessionUseCase('', mockRepo)).rejects.toThrow('sessionId is required');
  });
});
