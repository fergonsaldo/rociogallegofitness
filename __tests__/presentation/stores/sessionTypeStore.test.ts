/**
 * sessionTypeStore tests (RF-E8-05)
 */

import { act } from 'react';
import { useSessionTypeStore } from '../../../src/presentation/stores/sessionTypeStore';
import { SessionType } from '../../../src/domain/entities/SessionType';

// ── Mock use cases ─────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/SessionTypeUseCases', () => ({
  getSessionTypesUseCase:    jest.fn(),
  createSessionTypeUseCase:  jest.fn(),
  updateSessionTypeUseCase:  jest.fn(),
  deleteSessionTypeUseCase:  jest.fn(),
}));

import {
  getSessionTypesUseCase,
  createSessionTypeUseCase,
  updateSessionTypeUseCase,
  deleteSessionTypeUseCase,
} from '../../../src/application/coach/SessionTypeUseCases';

const mockGetAll  = getSessionTypesUseCase   as jest.MockedFunction<typeof getSessionTypesUseCase>;
const mockCreate  = createSessionTypeUseCase as jest.MockedFunction<typeof createSessionTypeUseCase>;
const mockUpdate  = updateSessionTypeUseCase as jest.MockedFunction<typeof updateSessionTypeUseCase>;
const mockDelete  = deleteSessionTypeUseCase as jest.MockedFunction<typeof deleteSessionTypeUseCase>;

// ── Mock repo (store instantiates it internally) ──────────────────────────────

jest.mock('../../../src/infrastructure/supabase/remote/SessionTypeRemoteRepository', () => ({
  SessionTypeRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const NOW      = new Date();

const TYPE_A: SessionType = { id: 'type-a', coachId: COACH_ID, name: 'Movilidad', color: '#059669', createdAt: NOW };
const TYPE_B: SessionType = { id: 'type-b', coachId: COACH_ID, name: 'Fuerza',    color: '#DC2626', createdAt: NOW };

function resetStore() {
  useSessionTypeStore.setState({ sessionTypes: [], isLoading: false, error: null });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── fetchSessionTypes ─────────────────────────────────────────────────────────

describe('useSessionTypeStore — fetchSessionTypes', () => {
  it('sets sessionTypes on successful fetch', async () => {
    mockGetAll.mockResolvedValue([TYPE_A, TYPE_B]);

    await act(async () => {
      await useSessionTypeStore.getState().fetchSessionTypes(COACH_ID);
    });

    const state = useSessionTypeStore.getState();
    expect(state.sessionTypes).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets isLoading true while fetching then false after', async () => {
    let resolve!: (v: SessionType[]) => void;
    mockGetAll.mockReturnValue(new Promise((res) => { resolve = res; }));

    act(() => { useSessionTypeStore.getState().fetchSessionTypes(COACH_ID); });

    expect(useSessionTypeStore.getState().isLoading).toBe(true);

    await act(async () => { resolve([TYPE_A]); });

    expect(useSessionTypeStore.getState().isLoading).toBe(false);
  });

  it('sets error on fetch failure', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useSessionTypeStore.getState().fetchSessionTypes(COACH_ID);
    });

    const state = useSessionTypeStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.sessionTypes).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('uses fallback error string when error has no message', async () => {
    mockGetAll.mockRejectedValue('unexpected');

    await act(async () => {
      await useSessionTypeStore.getState().fetchSessionTypes(COACH_ID);
    });

    expect(useSessionTypeStore.getState().error).toBe('Error al cargar los tipos de sesión');
  });

  it('clears previous error before fetching', async () => {
    useSessionTypeStore.setState({ error: 'old error' });
    mockGetAll.mockResolvedValue([]);

    await act(async () => {
      await useSessionTypeStore.getState().fetchSessionTypes(COACH_ID);
    });

    expect(useSessionTypeStore.getState().error).toBeNull();
  });
});

// ── createSessionType ─────────────────────────────────────────────────────────

describe('useSessionTypeStore — createSessionType', () => {
  it('adds new session type to sorted list', async () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_B] });
    mockCreate.mockResolvedValue(TYPE_A);

    await act(async () => {
      await useSessionTypeStore.getState().createSessionType({ coachId: COACH_ID, name: 'Movilidad', color: '#059669' });
    });

    const { sessionTypes } = useSessionTypeStore.getState();
    expect(sessionTypes).toHaveLength(2);
    expect(sessionTypes[0].name).toBe('Fuerza'); // F < M alphabetically
  });

  it('returns the created session type', async () => {
    mockCreate.mockResolvedValue(TYPE_A);
    let result!: SessionType;
    await act(async () => {
      result = await useSessionTypeStore.getState().createSessionType({ coachId: COACH_ID, name: 'Movilidad', color: '#059669' });
    });
    expect(result.id).toBe('type-a');
  });

  it('sets error and rethrows on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Insert failed'));

    await act(async () => {
      await expect(useSessionTypeStore.getState().createSessionType({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' }))
        .rejects.toThrow('Insert failed');
    });

    expect(useSessionTypeStore.getState().error).toBe('Insert failed');
  });

  it('uses fallback error string when error has no message', async () => {
    mockCreate.mockRejectedValue('oops');

    await act(async () => {
      await expect(useSessionTypeStore.getState().createSessionType({ coachId: COACH_ID, name: 'Fuerza', color: '#DC2626' }))
        .rejects.toBeTruthy();
    });

    expect(useSessionTypeStore.getState().error).toBe('Error al crear el tipo de sesión');
  });
});

// ── updateSessionType ─────────────────────────────────────────────────────────

describe('useSessionTypeStore — updateSessionType', () => {
  it('replaces the session type in list and keeps it sorted', async () => {
    const updated = { ...TYPE_B, name: 'AAA' };
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A, TYPE_B] });
    mockUpdate.mockResolvedValue(updated);

    await act(async () => {
      await useSessionTypeStore.getState().updateSessionType('type-b', { name: 'AAA' });
    });

    const { sessionTypes } = useSessionTypeStore.getState();
    expect(sessionTypes[0].name).toBe('AAA');
    expect(sessionTypes).toHaveLength(2);
  });

  it('returns the updated session type', async () => {
    const updated = { ...TYPE_A, color: '#000000' };
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A] });
    mockUpdate.mockResolvedValue(updated);

    let result!: SessionType;
    await act(async () => {
      result = await useSessionTypeStore.getState().updateSessionType('type-a', { color: '#000000' });
    });
    expect(result.color).toBe('#000000');
  });

  it('sets error and rethrows on failure', async () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A] });
    mockUpdate.mockRejectedValue(new Error('RLS error'));

    await act(async () => {
      await expect(useSessionTypeStore.getState().updateSessionType('type-a', { name: 'X' }))
        .rejects.toThrow('RLS error');
    });

    expect(useSessionTypeStore.getState().error).toBe('RLS error');
  });

  it('uses fallback error string when error has no message', async () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A] });
    mockUpdate.mockRejectedValue('unexpected');

    await act(async () => {
      await expect(useSessionTypeStore.getState().updateSessionType('type-a', { name: 'X' }))
        .rejects.toBeTruthy();
    });

    expect(useSessionTypeStore.getState().error).toBe('Error al actualizar el tipo de sesión');
  });
});

// ── deleteSessionType ─────────────────────────────────────────────────────────

describe('useSessionTypeStore — deleteSessionType', () => {
  it('removes the session type from list', async () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A, TYPE_B] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useSessionTypeStore.getState().deleteSessionType('type-a');
    });

    const { sessionTypes } = useSessionTypeStore.getState();
    expect(sessionTypes).toHaveLength(1);
    expect(sessionTypes[0].id).toBe('type-b');
  });

  it('sets error and rethrows on failure', async () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A] });
    mockDelete.mockRejectedValue(new Error('Delete failed'));

    await act(async () => {
      await expect(useSessionTypeStore.getState().deleteSessionType('type-a'))
        .rejects.toThrow('Delete failed');
    });

    expect(useSessionTypeStore.getState().error).toBe('Delete failed');
  });

  it('uses fallback error string when error has no message', async () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A] });
    mockDelete.mockRejectedValue('oops');

    await act(async () => {
      await expect(useSessionTypeStore.getState().deleteSessionType('type-a'))
        .rejects.toBeTruthy();
    });

    expect(useSessionTypeStore.getState().error).toBe('Error al eliminar el tipo de sesión');
  });
});

// ── clearError ────────────────────────────────────────────────────────────────

describe('useSessionTypeStore — clearError', () => {
  it('clears the error field', () => {
    useSessionTypeStore.setState({ error: 'some error' });
    act(() => { useSessionTypeStore.getState().clearError(); });
    expect(useSessionTypeStore.getState().error).toBeNull();
  });

  it('does not affect sessionTypes or isLoading when clearing error', () => {
    useSessionTypeStore.setState({ sessionTypes: [TYPE_A], isLoading: false, error: 'err' });
    act(() => { useSessionTypeStore.getState().clearError(); });
    const state = useSessionTypeStore.getState();
    expect(state.sessionTypes).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });
});
