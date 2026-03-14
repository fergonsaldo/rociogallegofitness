/**
 * workoutStore tests
 *
 * Testa la lógica del store de Zustand de forma aislada.
 * Los use cases Y el repositorio se mockean para que el test
 * verifique únicamente el comportamiento del store (state transitions).
 */

// ── Mock use cases (aislamos el store completamente) ──────────────────────────

const mockStartWorkoutSessionUseCase    = jest.fn();
const mockLogExerciseSetUseCase         = jest.fn();
const mockFinishWorkoutSessionUseCase   = jest.fn();
const mockAbandonWorkoutSessionUseCase  = jest.fn();

jest.mock('../../../src/application/athlete/WorkoutUseCases', () => ({
  startWorkoutSessionUseCase:   (...args: unknown[]) => mockStartWorkoutSessionUseCase(...args),
  logExerciseSetUseCase:        (...args: unknown[]) => mockLogExerciseSetUseCase(...args),
  finishWorkoutSessionUseCase:  (...args: unknown[]) => mockFinishWorkoutSessionUseCase(...args),
  abandonWorkoutSessionUseCase: (...args: unknown[]) => mockAbandonWorkoutSessionUseCase(...args),
}));

// Patrón __mocks: la factory crea los jest.fn() internamente (sin referencias externas)
// y los expone para que los tests puedan configurarlos via require().
// Esto resuelve el problema de hoisting de const con jest.mock.
jest.mock('../../../src/infrastructure/database/local/WorkoutLocalRepository', () => {
  const getActiveSession    = jest.fn();
  const startSession        = jest.fn();
  const getSessionById      = jest.fn();
  const logSet              = jest.fn();
  const finishSession       = jest.fn();
  const abandonSession      = jest.fn();
  const markSynced          = jest.fn();
  const getUnsyncedSessions = jest.fn();
  const getSessionHistory   = jest.fn();
  const repoMock = {
    getActiveSession, startSession, getSessionById, logSet,
    finishSession, abandonSession, markSynced, getUnsyncedSessions, getSessionHistory,
  };
  return {
    WorkoutLocalRepository: jest.fn().mockImplementation(() => repoMock),
    __repoMock: repoMock,
  };
});

jest.mock('../../../src/infrastructure/sync/SyncService', () => ({
  syncService: { syncPendingSessions: jest.fn().mockResolvedValue(undefined) },
}));

import { act } from '@testing-library/react-native';
import { useWorkoutStore } from '../../../src/presentation/stores/workoutStore';
import { WorkoutSession } from '../../../src/domain/entities/WorkoutSession';
import { ExerciseSet } from '../../../src/domain/entities/ExerciseSet';

// Capturamos las referencias del mock via require() (después del hoisting)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const repoMock = require('../../../src/infrastructure/database/local/WorkoutLocalRepository').__repoMock as {
  getActiveSession: jest.Mock; startSession: jest.Mock; getSessionById: jest.Mock;
  logSet: jest.Mock; finishSession: jest.Mock; abandonSession: jest.Mock;
  markSynced: jest.Mock; getUnsyncedSessions: jest.Mock; getSessionHistory: jest.Mock;
};


// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID  = '00000000-0000-4000-a000-000000000001';
const SESSION_ID  = '00000000-0000-4000-c000-000000000001';
const EXERCISE_ID = '00000000-0000-4000-f000-000000000001';
const NOW         = new Date();

const ACTIVE_SESSION: WorkoutSession = {
  id: SESSION_ID, athleteId: ATHLETE_ID, status: 'active',
  sets: [], startedAt: NOW,
};

const REPS_SET: ExerciseSet = {
  id: '00000000-0000-4000-f000-000000000002', sessionId: SESSION_ID, exerciseId: EXERCISE_ID,
  setNumber: 1, performance: { type: 'reps', reps: 10, weightKg: 80 },
  restAfterSeconds: 90, completedAt: NOW,
};

const SUMMARY = {
  session:            { ...ACTIVE_SESSION, status: 'completed' as const, finishedAt: NOW },
  totalSets:          1,
  totalVolumeKg:      800,
  durationSeconds:    3600,
  exercisesCompleted: 1,
};

function resetStore() {
  useWorkoutStore.setState({
    session: null, lastSummary: null,
    isLoading: false, error: null,
    restTimerSeconds: 0, restTimerActive: false,
  });
}

// ── startSession ──────────────────────────────────────────────────────────────

describe('workoutStore — startSession', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('sets session in state on success', async () => {
    mockStartWorkoutSessionUseCase.mockResolvedValue(ACTIVE_SESSION);

    await act(async () => {
      await useWorkoutStore.getState().startSession(ATHLETE_ID);
    });

    expect(useWorkoutStore.getState().session?.id).toBe(SESSION_ID);
    expect(useWorkoutStore.getState().isLoading).toBe(false);
    expect(useWorkoutStore.getState().error).toBeNull();
  });

  it('sets error in state when use case throws', async () => {
    mockStartWorkoutSessionUseCase.mockRejectedValue(new Error('Ya tienes una sesión activa'));

    await act(async () => {
      await useWorkoutStore.getState().startSession(ATHLETE_ID);
    });

    expect(useWorkoutStore.getState().error).toContain('Ya tienes una sesión activa');
    expect(useWorkoutStore.getState().session).toBeNull();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });
});

// ── logSet ────────────────────────────────────────────────────────────────────

describe('workoutStore — logSet', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('appends the new set to session.sets optimistically', async () => {
    useWorkoutStore.setState({ session: ACTIVE_SESSION });
    mockLogExerciseSetUseCase.mockResolvedValue(REPS_SET);

    await act(async () => {
      await useWorkoutStore.getState().logSet({
        exerciseId:       EXERCISE_ID,
        performance:      { type: 'reps', reps: 10, weightKg: 80 },
        restAfterSeconds: 90,
      });
    });

    expect(useWorkoutStore.getState().session?.sets).toHaveLength(1);
    expect(useWorkoutStore.getState().session?.sets[0].id).toBe(REPS_SET.id);
  });

  it('sets error when there is no active session', async () => {
    useWorkoutStore.setState({ session: null });

    await act(async () => {
      const result = await useWorkoutStore.getState().logSet({
        exerciseId:       EXERCISE_ID,
        performance:      { type: 'reps', reps: 10, weightKg: 80 },
        restAfterSeconds: 90,
      });
      expect(result).toBeNull();
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
  });

  it('sets error when use case throws', async () => {
    useWorkoutStore.setState({ session: ACTIVE_SESSION });
    mockLogExerciseSetUseCase.mockRejectedValue(new Error('session not active'));

    await act(async () => {
      const result = await useWorkoutStore.getState().logSet({
        exerciseId:       EXERCISE_ID,
        performance:      { type: 'reps', reps: 10, weightKg: 80 },
        restAfterSeconds: 90,
      });
      expect(result).toBeNull();
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
  });
});

// ── finishSession ─────────────────────────────────────────────────────────────

describe('workoutStore — finishSession', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('clears session and sets lastSummary on success', async () => {
    useWorkoutStore.setState({ session: ACTIVE_SESSION });
    mockFinishWorkoutSessionUseCase.mockResolvedValue(SUMMARY);

    await act(async () => {
      await useWorkoutStore.getState().finishSession();
    });

    expect(useWorkoutStore.getState().session).toBeNull();
    expect(useWorkoutStore.getState().lastSummary).not.toBeNull();
    expect(useWorkoutStore.getState().isLoading).toBe(false);
  });

  it('returns null and does nothing when no active session', async () => {
    useWorkoutStore.setState({ session: null });

    await act(async () => {
      const result = await useWorkoutStore.getState().finishSession();
      expect(result).toBeNull();
    });

    expect(useWorkoutStore.getState().lastSummary).toBeNull();
    expect(mockFinishWorkoutSessionUseCase).not.toHaveBeenCalled();
  });

  it('sets error when use case throws', async () => {
    useWorkoutStore.setState({ session: ACTIVE_SESSION });
    mockFinishWorkoutSessionUseCase.mockRejectedValue(new Error('finish failed'));

    await act(async () => {
      await useWorkoutStore.getState().finishSession();
    });

    expect(useWorkoutStore.getState().error).toBeTruthy();
    expect(useWorkoutStore.getState().session).not.toBeNull(); // session preserved on error
  });
});

// ── abandonSession ────────────────────────────────────────────────────────────

describe('workoutStore — abandonSession', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('clears session and rest timer on success', async () => {
    useWorkoutStore.setState({ session: ACTIVE_SESSION, restTimerActive: true, restTimerSeconds: 30 });
    mockAbandonWorkoutSessionUseCase.mockResolvedValue(undefined);

    await act(async () => {
      await useWorkoutStore.getState().abandonSession();
    });

    expect(useWorkoutStore.getState().session).toBeNull();
    expect(useWorkoutStore.getState().restTimerActive).toBe(false);
    expect(useWorkoutStore.getState().restTimerSeconds).toBe(0);
  });

  it('does nothing when no active session', async () => {
    useWorkoutStore.setState({ session: null });

    await act(async () => {
      await useWorkoutStore.getState().abandonSession();
    });

    expect(mockAbandonWorkoutSessionUseCase).not.toHaveBeenCalled();
  });
});

// ── restoreActiveSession ──────────────────────────────────────────────────────
// restoreActiveSession llama directamente al repo (no usa use case)
// El repo está mockeado via WorkoutLocalRepository constructor mock

describe('workoutStore — restoreActiveSession', () => {
  beforeEach(() => { resetStore(); jest.clearAllMocks(); });

  it('restores an existing active session from local DB', async () => {
    repoMock.getActiveSession.mockResolvedValue(ACTIVE_SESSION);

    await act(async () => {
      await useWorkoutStore.getState().restoreActiveSession(ATHLETE_ID);
    });

    expect(useWorkoutStore.getState().session?.id).toBe(SESSION_ID);
  });

  it('leaves session null when no active session exists in DB', async () => {
    repoMock.getActiveSession.mockResolvedValue(null);

    await act(async () => {
      await useWorkoutStore.getState().restoreActiveSession(ATHLETE_ID);
    });

    expect(useWorkoutStore.getState().session).toBeNull();
  });
});

// ── Rest timer ────────────────────────────────────────────────────────────────

describe('workoutStore — rest timer', () => {
  beforeEach(() => resetStore());

  it('startRestTimer sets seconds and activates timer', () => {
    useWorkoutStore.getState().startRestTimer(90);
    expect(useWorkoutStore.getState().restTimerSeconds).toBe(90);
    expect(useWorkoutStore.getState().restTimerActive).toBe(true);
  });

  it('stopRestTimer deactivates and resets to 0', () => {
    useWorkoutStore.setState({ restTimerSeconds: 45, restTimerActive: true });
    useWorkoutStore.getState().stopRestTimer();
    expect(useWorkoutStore.getState().restTimerActive).toBe(false);
    expect(useWorkoutStore.getState().restTimerSeconds).toBe(0);
  });

  it('tickRestTimer decrements by 1 each tick', () => {
    useWorkoutStore.setState({ restTimerSeconds: 5, restTimerActive: true });
    useWorkoutStore.getState().tickRestTimer();
    expect(useWorkoutStore.getState().restTimerSeconds).toBe(4);
  });

  it('tickRestTimer stops timer when it reaches 0', () => {
    useWorkoutStore.setState({ restTimerSeconds: 1, restTimerActive: true });
    useWorkoutStore.getState().tickRestTimer();
    expect(useWorkoutStore.getState().restTimerSeconds).toBe(0);
    expect(useWorkoutStore.getState().restTimerActive).toBe(false);
  });

  it('tickRestTimer stays at 0 when already stopped', () => {
    useWorkoutStore.setState({ restTimerSeconds: 0, restTimerActive: false });
    useWorkoutStore.getState().tickRestTimer();
    expect(useWorkoutStore.getState().restTimerSeconds).toBe(0);
    expect(useWorkoutStore.getState().restTimerActive).toBe(false);
  });
});

// ── clearError / clearSummary ─────────────────────────────────────────────────

describe('workoutStore — clearError y clearSummary', () => {
  it('clearError sets error to null', () => {
    useWorkoutStore.setState({ error: 'algo falló' });
    useWorkoutStore.getState().clearError();
    expect(useWorkoutStore.getState().error).toBeNull();
  });

  it('clearSummary sets lastSummary to null', () => {
    useWorkoutStore.setState({ lastSummary: SUMMARY });
    useWorkoutStore.getState().clearSummary();
    expect(useWorkoutStore.getState().lastSummary).toBeNull();
  });
});
