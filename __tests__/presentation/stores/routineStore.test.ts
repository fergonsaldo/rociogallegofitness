/**
 * routineStore tests — assignMultipleToAthlete
 */

import { act } from 'react';
import { useRoutineStore } from '../../../src/presentation/stores/routineStore';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/AssignRoutineUseCase', () => ({
  assignRoutineUseCase:          jest.fn(),
  unassignRoutineUseCase:        jest.fn(),
  assignMultipleRoutinesUseCase: jest.fn(),
}));

jest.mock('../../../src/application/coach/CreateRoutineUseCase',  () => ({ createRoutineUseCase: jest.fn() }));
jest.mock('../../../src/application/coach/GetRoutinesUseCase',    () => ({
  getCoachRoutinesUseCase:   jest.fn(),
  getAthleteRoutinesUseCase: jest.fn(),
  getRoutineByIdUseCase:     jest.fn(),
}));
jest.mock('../../../src/application/coach/DeleteRoutineUseCase',  () => ({ deleteRoutineUseCase: jest.fn() }));

jest.mock('../../../src/infrastructure/supabase/remote/RoutineRemoteRepository', () => ({
  RoutineRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import { assignMultipleRoutinesUseCase } from '../../../src/application/coach/AssignRoutineUseCase';

const mockAssignMultiple = assignMultipleRoutinesUseCase as jest.MockedFunction<
  typeof assignMultipleRoutinesUseCase
>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID  = '323e4567-e89b-12d3-a456-426614174002';
const ROUTINE_ID_A = '423e4567-e89b-12d3-a456-426614174003';
const ROUTINE_ID_B = '523e4567-e89b-12d3-a456-426614174004';

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useRoutineStore.setState({
    routines: [],
    selectedRoutine: null,
    isLoading: false,
    isCreating: false,
    error: null,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

describe('useRoutineStore — assignMultipleToAthlete', () => {
  it('returns true on success', async () => {
    mockAssignMultiple.mockResolvedValue();

    let result!: boolean;
    await act(async () => {
      result = await useRoutineStore.getState().assignMultipleToAthlete(
        [ROUTINE_ID_A, ROUTINE_ID_B],
        ATHLETE_ID,
      );
    });

    expect(result).toBe(true);
  });

  it('calls use case with correct arguments', async () => {
    mockAssignMultiple.mockResolvedValue();

    await act(async () => {
      await useRoutineStore.getState().assignMultipleToAthlete(
        [ROUTINE_ID_A],
        ATHLETE_ID,
      );
    });

    expect(mockAssignMultiple).toHaveBeenCalledWith(
      [ROUTINE_ID_A],
      ATHLETE_ID,
      expect.anything(),
    );
  });

  it('returns false and sets error on failure', async () => {
    mockAssignMultiple.mockRejectedValue(new Error('Assign failed'));

    let result!: boolean;
    await act(async () => {
      result = await useRoutineStore.getState().assignMultipleToAthlete(
        [ROUTINE_ID_A],
        ATHLETE_ID,
      );
    });

    expect(result).toBe(false);
    expect(useRoutineStore.getState().error).toBe('Assign failed');
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockAssignMultiple.mockRejectedValue('unexpected');

    await act(async () => {
      await useRoutineStore.getState().assignMultipleToAthlete([ROUTINE_ID_A], ATHLETE_ID);
    });

    expect(useRoutineStore.getState().error).toBe('Error al asignar la rutina');
  });

  it('clears previous error before attempting assignment', async () => {
    useRoutineStore.setState({ error: 'old error' });
    mockAssignMultiple.mockResolvedValue();

    await act(async () => {
      await useRoutineStore.getState().assignMultipleToAthlete([ROUTINE_ID_A], ATHLETE_ID);
    });

    expect(useRoutineStore.getState().error).toBeNull();
  });

  it('does not modify routines list on success', async () => {
    mockAssignMultiple.mockResolvedValue();
    useRoutineStore.setState({ routines: [] });

    await act(async () => {
      await useRoutineStore.getState().assignMultipleToAthlete([ROUTINE_ID_A], ATHLETE_ID);
    });

    expect(useRoutineStore.getState().routines).toHaveLength(0);
  });
});
