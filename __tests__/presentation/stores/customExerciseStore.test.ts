/**
 * customExerciseStore tests
 */

import { act } from 'react';
import { useCustomExerciseStore } from '../../../src/presentation/stores/customExerciseStore';
import { CatalogExercise } from '../../../src/application/coach/CustomExerciseUseCases';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/CustomExerciseUseCases', () => ({
  getCoachCustomExercisesUseCase: jest.fn(),
  createCustomExerciseUseCase:    jest.fn(),
  updateCustomExerciseUseCase:    jest.fn(),
  deleteCustomExerciseUseCase:    jest.fn(),
  getAllExercisesUseCase:         jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/CustomExerciseRemoteRepository', () => ({
  CustomExerciseRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import {
  getAllExercisesUseCase,
  deleteCustomExerciseUseCase,
} from '../../../src/application/coach/CustomExerciseUseCases';

const mockGetAll = getAllExercisesUseCase    as jest.MockedFunction<typeof getAllExercisesUseCase>;
const mockDelete = deleteCustomExerciseUseCase as jest.MockedFunction<typeof deleteCustomExerciseUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';

function makeItem(id: string, coachId: string | null = null): CatalogExercise {
  return {
    id,
    name:             `Exercise ${id}`,
    category:         'strength',
    primaryMuscles:   ['chest'],
    secondaryMuscles: [],
    isIsometric:      false,
    coachId,
  };
}

const ITEM_A = makeItem('id-a');
const ITEM_B = makeItem('id-b', COACH_ID);
const ITEM_C = makeItem('id-c');

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useCustomExerciseStore.setState({
    exercises:  [],
    catalog:    [],
    isLoading:  false,
    error:      null,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── fetchAll ──────────────────────────────────────────────────────────────────

describe('useCustomExerciseStore — fetchAll', () => {
  it('sets catalog on success', async () => {
    mockGetAll.mockResolvedValue([ITEM_A, ITEM_B]);

    await act(async () => {
      await useCustomExerciseStore.getState().fetchAll(COACH_ID);
    });

    const { catalog, isLoading, error } = useCustomExerciseStore.getState();
    expect(catalog).toHaveLength(2);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('sets isLoading true during fetch then false after', async () => {
    let resolve!: (v: CatalogExercise[]) => void;
    mockGetAll.mockReturnValue(new Promise((res) => { resolve = res; }));

    act(() => { useCustomExerciseStore.getState().fetchAll(COACH_ID); });
    expect(useCustomExerciseStore.getState().isLoading).toBe(true);

    await act(async () => { resolve([ITEM_A]); });
    expect(useCustomExerciseStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useCustomExerciseStore.getState().fetchAll(COACH_ID);
    });

    const { error, isLoading } = useCustomExerciseStore.getState();
    expect(error).toBe('Network error');
    expect(isLoading).toBe(false);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockGetAll.mockRejectedValue('unexpected');

    await act(async () => {
      await useCustomExerciseStore.getState().fetchAll(COACH_ID);
    });

    expect(useCustomExerciseStore.getState().error).toBe('Error al cargar ejercicios');
  });

  it('clears previous error before new fetch', async () => {
    useCustomExerciseStore.setState({ error: 'old error' });
    mockGetAll.mockResolvedValue([]);

    await act(async () => {
      await useCustomExerciseStore.getState().fetchAll(COACH_ID);
    });

    expect(useCustomExerciseStore.getState().error).toBeNull();
  });

  it('calls use case with correct coachId', async () => {
    mockGetAll.mockResolvedValue([]);

    await act(async () => {
      await useCustomExerciseStore.getState().fetchAll(COACH_ID);
    });

    expect(mockGetAll).toHaveBeenCalledWith(COACH_ID, expect.anything());
  });
});

// ── delete syncs catalog ──────────────────────────────────────────────────────

describe('useCustomExerciseStore — delete removes from catalog', () => {
  it('removes the item from catalog on successful delete', async () => {
    useCustomExerciseStore.setState({ catalog: [ITEM_A, ITEM_B, ITEM_C] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useCustomExerciseStore.getState().delete('id-b');
    });

    const { catalog } = useCustomExerciseStore.getState();
    expect(catalog).toHaveLength(2);
    expect(catalog.find((ex) => ex.id === 'id-b')).toBeUndefined();
  });

  it('does not modify catalog on delete failure', async () => {
    useCustomExerciseStore.setState({ catalog: [ITEM_A, ITEM_B] });
    mockDelete.mockRejectedValue(new Error('Cannot delete'));

    await act(async () => {
      await useCustomExerciseStore.getState().delete('id-b');
    });

    expect(useCustomExerciseStore.getState().catalog).toHaveLength(2);
  });

  it('sets error and returns false on delete failure', async () => {
    mockDelete.mockRejectedValue(new Error('In use'));

    let result!: boolean;
    await act(async () => {
      result = await useCustomExerciseStore.getState().delete('id-b');
    });

    expect(result).toBe(false);
    expect(useCustomExerciseStore.getState().error).toBe('In use');
  });
});
