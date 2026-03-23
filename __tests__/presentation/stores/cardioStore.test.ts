/**
 * cardioStore tests
 */

import { act } from 'react';
import { useCardioStore } from '../../../src/presentation/stores/cardioStore';
import { CatalogCardio } from '../../../src/domain/entities/Cardio';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/CardioUseCases', () => ({
  getAllCardiosUseCase:         jest.fn(),
  createCardioUseCase:         jest.fn(),
  deleteCardioUseCase:         jest.fn(),
  assignMultipleCardiosUseCase:jest.fn(),
  filterCardios:               jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/CardioRemoteRepository', () => ({
  CardioRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import {
  getAllCardiosUseCase,
  createCardioUseCase,
  deleteCardioUseCase,
  assignMultipleCardiosUseCase,
} from '../../../src/application/coach/CardioUseCases';

const mockGetAll          = getAllCardiosUseCase          as jest.MockedFunction<typeof getAllCardiosUseCase>;
const mockCreate          = createCardioUseCase           as jest.MockedFunction<typeof createCardioUseCase>;
const mockDelete          = deleteCardioUseCase           as jest.MockedFunction<typeof deleteCardioUseCase>;
const mockAssignMultiple  = assignMultipleCardiosUseCase  as jest.MockedFunction<typeof assignMultipleCardiosUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000001';
const ATHLETE_ID = '22222222-0000-4000-b000-000000000003';
const NOW = new Date();

function makeCardio(id: string, coachId: string | null = null): CatalogCardio {
  return {
    id, coachId,
    name: `Cardio ${id}`,
    type: 'running',
    intensity: 'medium',
    durationMinMinutes: 20,
    durationMaxMinutes: 40,
    createdAt: NOW,
  };
}

const CARDIO_A = makeCardio('id-a');
const CARDIO_B = makeCardio('id-b', COACH_ID);
const CARDIO_C = makeCardio('id-c');

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useCardioStore.setState({ catalog: [], isLoading: false, isCreating: false, error: null });
}

beforeEach(() => { jest.clearAllMocks(); resetStore(); });

// ── fetchAll ──────────────────────────────────────────────────────────────────

describe('useCardioStore — fetchAll', () => {
  it('sets catalog on success', async () => {
    mockGetAll.mockResolvedValue([CARDIO_A, CARDIO_B]);
    await act(async () => { await useCardioStore.getState().fetchAll(COACH_ID); });
    expect(useCardioStore.getState().catalog).toHaveLength(2);
    expect(useCardioStore.getState().isLoading).toBe(false);
    expect(useCardioStore.getState().error).toBeNull();
  });

  it('sets isLoading true during fetch then false after', async () => {
    let resolve!: (v: CatalogCardio[]) => void;
    mockGetAll.mockReturnValue(new Promise((res) => { resolve = res; }));
    act(() => { useCardioStore.getState().fetchAll(COACH_ID); });
    expect(useCardioStore.getState().isLoading).toBe(true);
    await act(async () => { resolve([CARDIO_A]); });
    expect(useCardioStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));
    await act(async () => { await useCardioStore.getState().fetchAll(COACH_ID); });
    expect(useCardioStore.getState().error).toBe('Network error');
    expect(useCardioStore.getState().isLoading).toBe(false);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockGetAll.mockRejectedValue('unexpected');
    await act(async () => { await useCardioStore.getState().fetchAll(COACH_ID); });
    expect(useCardioStore.getState().error).toBe('Error al cargar los cardios');
  });

  it('clears previous error before new fetch', async () => {
    useCardioStore.setState({ error: 'old error' });
    mockGetAll.mockResolvedValue([]);
    await act(async () => { await useCardioStore.getState().fetchAll(COACH_ID); });
    expect(useCardioStore.getState().error).toBeNull();
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('useCardioStore — create', () => {
  const INPUT = {
    coachId: COACH_ID, name: 'Mi cardio', type: 'running' as const,
    intensity: 'medium' as const, durationMinMinutes: 20, durationMaxMinutes: 40,
  };

  it('adds cardio to catalog sorted alphabetically', async () => {
    useCardioStore.setState({ catalog: [CARDIO_C] }); // 'Cardio id-c'
    const newCardio = makeCardio('id-new', COACH_ID);
    newCardio.name = 'Aeróbico matutino'; // sorts before 'Cardio...'
    mockCreate.mockResolvedValue(newCardio);

    await act(async () => { await useCardioStore.getState().create(INPUT); });

    const { catalog } = useCardioStore.getState();
    expect(catalog[0].id).toBe('id-new');
  });

  it('returns null and sets error on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Insert failed'));
    let result: CatalogCardio | null = undefined as any;
    await act(async () => { result = await useCardioStore.getState().create(INPUT); });
    expect(result).toBeNull();
    expect(useCardioStore.getState().error).toBe('Insert failed');
  });

  it('sets isCreating true during creation then false after', async () => {
    let resolve!: (v: CatalogCardio) => void;
    mockCreate.mockReturnValue(new Promise((res) => { resolve = res; }));
    act(() => { useCardioStore.getState().create(INPUT); });
    expect(useCardioStore.getState().isCreating).toBe(true);
    await act(async () => { resolve(makeCardio('x', COACH_ID)); });
    expect(useCardioStore.getState().isCreating).toBe(false);
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('useCardioStore — delete', () => {
  it('removes cardio from catalog on success', async () => {
    useCardioStore.setState({ catalog: [CARDIO_A, CARDIO_B, CARDIO_C] });
    mockDelete.mockResolvedValue();
    await act(async () => { await useCardioStore.getState().delete('id-b'); });
    expect(useCardioStore.getState().catalog).toHaveLength(2);
    expect(useCardioStore.getState().catalog.find((c) => c.id === 'id-b')).toBeUndefined();
  });

  it('returns false and sets error on failure', async () => {
    mockDelete.mockRejectedValue(new Error('Cannot delete'));
    let result!: boolean;
    await act(async () => { result = await useCardioStore.getState().delete('id-b'); });
    expect(result).toBe(false);
    expect(useCardioStore.getState().error).toBe('Cannot delete');
  });

  it('does not modify catalog on failure', async () => {
    useCardioStore.setState({ catalog: [CARDIO_A, CARDIO_B] });
    mockDelete.mockRejectedValue(new Error('Error'));
    await act(async () => { await useCardioStore.getState().delete('id-b'); });
    expect(useCardioStore.getState().catalog).toHaveLength(2);
  });
});

// ── assignMultipleToAthlete ───────────────────────────────────────────────────

describe('useCardioStore — assignMultipleToAthlete', () => {
  it('returns true on success', async () => {
    mockAssignMultiple.mockResolvedValue();
    let result!: boolean;
    await act(async () => {
      result = await useCardioStore.getState().assignMultipleToAthlete(['id-a', 'id-b'], ATHLETE_ID);
    });
    expect(result).toBe(true);
  });

  it('calls use case with correct arguments', async () => {
    mockAssignMultiple.mockResolvedValue();
    await act(async () => {
      await useCardioStore.getState().assignMultipleToAthlete(['id-a'], ATHLETE_ID);
    });
    expect(mockAssignMultiple).toHaveBeenCalledWith(['id-a'], ATHLETE_ID, expect.anything());
  });

  it('returns false and sets error on failure', async () => {
    mockAssignMultiple.mockRejectedValue(new Error('Assign failed'));
    let result!: boolean;
    await act(async () => {
      result = await useCardioStore.getState().assignMultipleToAthlete(['id-a'], ATHLETE_ID);
    });
    expect(result).toBe(false);
    expect(useCardioStore.getState().error).toBe('Assign failed');
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockAssignMultiple.mockRejectedValue('unexpected');
    await act(async () => {
      await useCardioStore.getState().assignMultipleToAthlete(['id-a'], ATHLETE_ID);
    });
    expect(useCardioStore.getState().error).toBe('Error al asignar el cardio');
  });

  it('clears previous error before assignment', async () => {
    useCardioStore.setState({ error: 'old error' });
    mockAssignMultiple.mockResolvedValue();
    await act(async () => {
      await useCardioStore.getState().assignMultipleToAthlete(['id-a'], ATHLETE_ID);
    });
    expect(useCardioStore.getState().error).toBeNull();
  });
});
