/**
 * coachCalendarStore tests
 */

import { act } from 'react';
import { useCoachCalendarStore } from '../../../src/presentation/stores/coachCalendarStore';
import { CoachSession, CreateCoachSessionInput } from '../../../src/domain/entities/CoachSession';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/CoachSessionUseCases', () => ({
  getSessionsForMonthUseCase:  jest.fn(),
  getSessionsForRangeUseCase:  jest.fn(),
  createSessionUseCase:        jest.fn(),
  updateSessionUseCase:        jest.fn(),
  deleteSessionUseCase:        jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/CoachSessionRemoteRepository', () => ({
  CoachSessionRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import {
  getSessionsForMonthUseCase,
  getSessionsForRangeUseCase,
  createSessionUseCase,
  updateSessionUseCase,
  deleteSessionUseCase,
} from '../../../src/application/coach/CoachSessionUseCases';

const mockGetSessions = getSessionsForMonthUseCase as jest.MockedFunction<typeof getSessionsForMonthUseCase>;
const mockGetRange    = getSessionsForRangeUseCase  as jest.MockedFunction<typeof getSessionsForRangeUseCase>;
const mockCreate      = createSessionUseCase        as jest.MockedFunction<typeof createSessionUseCase>;
const mockUpdate      = updateSessionUseCase        as jest.MockedFunction<typeof updateSessionUseCase>;
const mockDelete      = deleteSessionUseCase        as jest.MockedFunction<typeof deleteSessionUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = 'coac-uuid-0001-0000-000000000001';
const SESSION_ID = 'sess-uuid-0001-0000-000000000001';

function makeSession(scheduledAt: Date, overrides: Partial<CoachSession> = {}): CoachSession {
  return {
    id:              SESSION_ID,
    coachId:         COACH_ID,
    athleteId:       null,
    athleteName:     null,
    title:           null,
    sessionType:     'Entrenamiento',
    modality:        'in_person',
    scheduledAt,
    durationMinutes: 60,
    notes:           null,
    createdAt:       new Date(),
    ...overrides,
  };
}

const T10 = new Date('2026-03-22T10:00:00Z');
const T12 = new Date('2026-03-22T12:00:00Z');
const T14 = new Date('2026-03-22T14:00:00Z');

const SESSION_A = makeSession(T10, { id: 'id-a' });
const SESSION_B = makeSession(T12, { id: 'id-b' });
const SESSION_C = makeSession(T14, { id: 'id-c' });

const CREATE_INPUT: CreateCoachSessionInput = {
  coachId:         COACH_ID,
  athleteId:       null,
  title:           null,
  sessionType:     'Entrenamiento',
  modality:        'in_person',
  scheduledAt:     T10,
  durationMinutes: 60,
  notes:           null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useCoachCalendarStore.setState({
    sessions:       [],
    selectedDate:   new Date(),
    isLoading:      false,
    rangeSessions:  [],
    isLoadingRange: false,
    listFilters:    { sessionTypes: [], modalities: [] },
    error:          null,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── fetchMonth ────────────────────────────────────────────────────────────────

describe('useCoachCalendarStore — fetchMonth', () => {
  it('sets sessions sorted by scheduledAt on success', async () => {
    mockGetSessions.mockResolvedValue([SESSION_B, SESSION_A]);

    await act(async () => {
      await useCoachCalendarStore.getState().fetchMonth(COACH_ID, 2026, 3);
    });

    const { sessions, isLoading, error } = useCoachCalendarStore.getState();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe('id-b'); // as returned by use case
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('sets isLoading true during fetch then false after', async () => {
    let resolve!: (v: CoachSession[]) => void;
    mockGetSessions.mockReturnValue(new Promise((res) => { resolve = res; }));

    act(() => { useCoachCalendarStore.getState().fetchMonth(COACH_ID, 2026, 3); });
    expect(useCoachCalendarStore.getState().isLoading).toBe(true);

    await act(async () => { resolve([SESSION_A]); });
    expect(useCoachCalendarStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure and clears sessions', async () => {
    mockGetSessions.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useCoachCalendarStore.getState().fetchMonth(COACH_ID, 2026, 3);
    });

    const { error, isLoading } = useCoachCalendarStore.getState();
    expect(error).toBe('Network error');
    expect(isLoading).toBe(false);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockGetSessions.mockRejectedValue('unexpected');

    await act(async () => {
      await useCoachCalendarStore.getState().fetchMonth(COACH_ID, 2026, 3);
    });

    expect(useCoachCalendarStore.getState().error).toBe('Error al cargar las sesiones');
  });

  it('clears previous error before new fetch', async () => {
    useCoachCalendarStore.setState({ error: 'old error' });
    mockGetSessions.mockResolvedValue([]);

    await act(async () => {
      await useCoachCalendarStore.getState().fetchMonth(COACH_ID, 2026, 3);
    });

    expect(useCoachCalendarStore.getState().error).toBeNull();
  });

  it('calls use case with correct arguments', async () => {
    mockGetSessions.mockResolvedValue([]);

    await act(async () => {
      await useCoachCalendarStore.getState().fetchMonth(COACH_ID, 2026, 3);
    });

    expect(mockGetSessions).toHaveBeenCalledWith(COACH_ID, 2026, 3, expect.anything());
  });
});

// ── addSession ────────────────────────────────────────────────────────────────

describe('useCoachCalendarStore — addSession', () => {
  it('adds session sorted by scheduledAt', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_C, SESSION_A] });
    mockCreate.mockResolvedValue(SESSION_B);

    await act(async () => {
      await useCoachCalendarStore.getState().addSession(CREATE_INPUT);
    });

    const { sessions } = useCoachCalendarStore.getState();
    expect(sessions).toHaveLength(3);
    expect(sessions[0].scheduledAt.getTime()).toBeLessThanOrEqual(sessions[1].scheduledAt.getTime());
    expect(sessions[1].scheduledAt.getTime()).toBeLessThanOrEqual(sessions[2].scheduledAt.getTime());
  });

  it('returns the created session', async () => {
    mockCreate.mockResolvedValue(SESSION_A);

    let result!: CoachSession;
    await act(async () => {
      result = await useCoachCalendarStore.getState().addSession(CREATE_INPUT);
    });

    expect(result.id).toBe(SESSION_A.id);
  });

  it('sets error and rethrows on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Overlap'));

    await act(async () => {
      await expect(useCoachCalendarStore.getState().addSession(CREATE_INPUT))
        .rejects.toThrow('Overlap');
    });

    expect(useCoachCalendarStore.getState().error).toBe('Overlap');
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockCreate.mockRejectedValue('boom');

    await act(async () => {
      await expect(useCoachCalendarStore.getState().addSession(CREATE_INPUT)).rejects.toBeTruthy();
    });

    expect(useCoachCalendarStore.getState().error).toBe('Error al crear la sesión');
  });
});

// ── editSession ───────────────────────────────────────────────────────────────

describe('useCoachCalendarStore — editSession', () => {
  it('replaces the session in state with the updated version', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A, SESSION_B] });
    const updated = { ...SESSION_A, title: 'Editada' };
    mockUpdate.mockResolvedValue(updated);

    await act(async () => {
      await useCoachCalendarStore.getState().editSession('id-a', { title: 'Editada' }, COACH_ID);
    });

    const { sessions } = useCoachCalendarStore.getState();
    expect(sessions.find((s) => s.id === 'id-a')?.title).toBe('Editada');
  });

  it('keeps catalog sorted by scheduledAt after update', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A, SESSION_B] });
    // move SESSION_A to T14 so it should now come after SESSION_B (T12)
    const movedA = { ...SESSION_A, scheduledAt: T14, id: 'id-a' };
    mockUpdate.mockResolvedValue(movedA);

    await act(async () => {
      await useCoachCalendarStore.getState().editSession('id-a', { scheduledAt: T14 }, COACH_ID);
    });

    const ids = useCoachCalendarStore.getState().sessions.map((s) => s.id);
    expect(ids[0]).toBe('id-b');
    expect(ids[1]).toBe('id-a');
  });

  it('also updates rangeSessions', async () => {
    useCoachCalendarStore.setState({
      sessions:      [],
      rangeSessions: [SESSION_A, SESSION_B],
    });
    const updated = { ...SESSION_A, title: 'Range update' };
    mockUpdate.mockResolvedValue(updated);

    await act(async () => {
      await useCoachCalendarStore.getState().editSession('id-a', { title: 'Range update' }, COACH_ID);
    });

    const { rangeSessions } = useCoachCalendarStore.getState();
    expect(rangeSessions.find((s) => s.id === 'id-a')?.title).toBe('Range update');
  });

  it('returns the updated session on success', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A] });
    const updated = { ...SESSION_A, title: 'Retorno' };
    mockUpdate.mockResolvedValue(updated);

    let result: CoachSession | undefined;
    await act(async () => {
      result = await useCoachCalendarStore.getState().editSession('id-a', { title: 'Retorno' }, COACH_ID);
    });

    expect(result?.title).toBe('Retorno');
  });

  it('sets error and re-throws when use case throws', async () => {
    mockUpdate.mockRejectedValue(new Error('La sesión se solapa'));

    await act(async () => {
      await expect(
        useCoachCalendarStore.getState().editSession('id-a', {}, COACH_ID),
      ).rejects.toThrow('La sesión se solapa');
    });

    expect(useCoachCalendarStore.getState().error).toBe('La sesión se solapa');
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockUpdate.mockRejectedValue('boom');

    await act(async () => {
      await expect(
        useCoachCalendarStore.getState().editSession('id-a', {}, COACH_ID),
      ).rejects.toBeTruthy();
    });

    expect(useCoachCalendarStore.getState().error).toBe('Ha ocurrido un error inesperado');
  });

  it('does not modify catalog on failure', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A, SESSION_B] });
    mockUpdate.mockRejectedValue(new Error('Error'));

    await act(async () => {
      await expect(
        useCoachCalendarStore.getState().editSession('id-a', { title: 'X' }, COACH_ID),
      ).rejects.toBeTruthy();
    });

    expect(useCoachCalendarStore.getState().sessions[0].title).toBe(SESSION_A.title);
  });
});

// ── removeSession ─────────────────────────────────────────────────────────────

describe('useCoachCalendarStore — removeSession', () => {
  it('removes the session from state', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A, SESSION_B] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useCoachCalendarStore.getState().removeSession('id-a');
    });

    const { sessions } = useCoachCalendarStore.getState();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('id-b');
  });

  it('does not modify sessions when id does not exist', async () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useCoachCalendarStore.getState().removeSession('non-existent');
    });

    expect(useCoachCalendarStore.getState().sessions).toHaveLength(1);
  });

  it('sets error and rethrows on failure', async () => {
    mockDelete.mockRejectedValue(new Error('Delete failed'));

    await act(async () => {
      await expect(useCoachCalendarStore.getState().removeSession(SESSION_ID))
        .rejects.toThrow('Delete failed');
    });

    expect(useCoachCalendarStore.getState().error).toBe('Delete failed');
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockDelete.mockRejectedValue('boom');

    await act(async () => {
      await expect(useCoachCalendarStore.getState().removeSession(SESSION_ID)).rejects.toBeTruthy();
    });

    expect(useCoachCalendarStore.getState().error).toBe('Error al eliminar la sesión');
  });
});

// ── setSelectedDate ───────────────────────────────────────────────────────────

describe('useCoachCalendarStore — setSelectedDate', () => {
  it('updates selectedDate', () => {
    const date = new Date('2026-04-15T00:00:00Z');

    act(() => {
      useCoachCalendarStore.getState().setSelectedDate(date);
    });

    expect(useCoachCalendarStore.getState().selectedDate).toEqual(date);
  });

  it('does not affect sessions or error', () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A], error: 'some error' });

    act(() => {
      useCoachCalendarStore.getState().setSelectedDate(new Date());
    });

    const state = useCoachCalendarStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.error).toBe('some error');
  });
});

// ── clearError ────────────────────────────────────────────────────────────────

describe('useCoachCalendarStore — clearError', () => {
  it('clears the error field', () => {
    useCoachCalendarStore.setState({ error: 'some error' });

    act(() => { useCoachCalendarStore.getState().clearError(); });

    expect(useCoachCalendarStore.getState().error).toBeNull();
  });

  it('does not affect sessions or isLoading', () => {
    useCoachCalendarStore.setState({ sessions: [SESSION_A], isLoading: false, error: 'err' });

    act(() => { useCoachCalendarStore.getState().clearError(); });

    const state = useCoachCalendarStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });
});

// ── fetchRange ────────────────────────────────────────────────────────────────

const FROM = new Date('2026-03-01T00:00:00Z');
const TO   = new Date('2026-04-01T00:00:00Z');

describe('useCoachCalendarStore — fetchRange', () => {
  it('sets rangeSessions on success', async () => {
    mockGetRange.mockResolvedValue([SESSION_A, SESSION_B]);

    await act(async () => {
      await useCoachCalendarStore.getState().fetchRange(COACH_ID, FROM, TO);
    });

    const { rangeSessions, isLoadingRange, error } = useCoachCalendarStore.getState();
    expect(rangeSessions).toHaveLength(2);
    expect(isLoadingRange).toBe(false);
    expect(error).toBeNull();
  });

  it('sets isLoadingRange true while fetching then false after', async () => {
    let resolve!: (v: CoachSession[]) => void;
    mockGetRange.mockReturnValue(new Promise((res) => { resolve = res; }));

    act(() => { useCoachCalendarStore.getState().fetchRange(COACH_ID, FROM, TO); });
    expect(useCoachCalendarStore.getState().isLoadingRange).toBe(true);

    await act(async () => { resolve([SESSION_A]); });
    expect(useCoachCalendarStore.getState().isLoadingRange).toBe(false);
  });

  it('sets error on failure', async () => {
    mockGetRange.mockRejectedValue(new Error('Range error'));

    await act(async () => {
      await useCoachCalendarStore.getState().fetchRange(COACH_ID, FROM, TO);
    });

    expect(useCoachCalendarStore.getState().error).toBe('Range error');
    expect(useCoachCalendarStore.getState().isLoadingRange).toBe(false);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockGetRange.mockRejectedValue('unexpected');

    await act(async () => {
      await useCoachCalendarStore.getState().fetchRange(COACH_ID, FROM, TO);
    });

    expect(useCoachCalendarStore.getState().error).toBe('Error al cargar las sesiones');
  });

  it('calls use case with correct arguments', async () => {
    mockGetRange.mockResolvedValue([]);

    await act(async () => {
      await useCoachCalendarStore.getState().fetchRange(COACH_ID, FROM, TO);
    });

    expect(mockGetRange).toHaveBeenCalledWith(COACH_ID, FROM, TO, expect.anything());
  });
});

// ── removeSession also clears rangeSessions ───────────────────────────────────

describe('useCoachCalendarStore — removeSession clears rangeSessions', () => {
  it('removes session from both sessions and rangeSessions', async () => {
    useCoachCalendarStore.setState({
      sessions:      [SESSION_A, SESSION_B],
      rangeSessions: [SESSION_A, SESSION_C],
    });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useCoachCalendarStore.getState().removeSession('id-a');
    });

    const state = useCoachCalendarStore.getState();
    expect(state.sessions.find((s) => s.id === 'id-a')).toBeUndefined();
    expect(state.rangeSessions.find((s) => s.id === 'id-a')).toBeUndefined();
  });
});

// ── setListFrom / setListTo / setListFilters ──────────────────────────────────

describe('useCoachCalendarStore — list state setters', () => {
  it('setListFrom updates listFrom', () => {
    const date = new Date('2026-05-01T00:00:00Z');
    act(() => { useCoachCalendarStore.getState().setListFrom(date); });
    expect(useCoachCalendarStore.getState().listFrom).toEqual(date);
  });

  it('setListTo updates listTo', () => {
    const date = new Date('2026-06-01T00:00:00Z');
    act(() => { useCoachCalendarStore.getState().setListTo(date); });
    expect(useCoachCalendarStore.getState().listTo).toEqual(date);
  });

  it('setListFilters updates filters', () => {
    const filters = { sessionTypes: ['Entrenamiento'], modalities: ['online' as const] };
    act(() => { useCoachCalendarStore.getState().setListFilters(filters); });
    expect(useCoachCalendarStore.getState().listFilters).toEqual(filters);
  });

  it('setListFilters with empty arrays means no filter', () => {
    act(() => {
      useCoachCalendarStore.getState().setListFilters({ sessionTypes: [], modalities: [] });
    });
    const { listFilters } = useCoachCalendarStore.getState();
    expect(listFilters.sessionTypes).toHaveLength(0);
    expect(listFilters.modalities).toHaveLength(0);
  });
});
