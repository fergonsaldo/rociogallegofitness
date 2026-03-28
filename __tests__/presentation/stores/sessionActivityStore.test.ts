import { act } from 'react';
import { useSessionActivityStore } from '../../../src/presentation/stores/sessionActivityStore';
import { SessionActivityLog } from '../../../src/domain/entities/SessionActivityLog';

// ── mock use case ──────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/SessionActivityLogUseCases', () => ({
  getSessionActivityUseCase: jest.fn(),
}));

import { getSessionActivityUseCase } from '../../../src/application/coach/SessionActivityLogUseCases';

// ── helpers ────────────────────────────────────────────────────────────────────

function makeLog(overrides: Partial<SessionActivityLog> = {}): SessionActivityLog {
  return {
    id:          'log-1',
    coachId:     'coach-1',
    sessionId:   'session-1',
    action:      'created',
    title:       'Sesión de fuerza',
    sessionType: 'Fuerza',
    modality:    'online',
    scheduledAt: new Date('2026-03-15T10:00:00Z'),
    loggedAt:    new Date('2026-03-15T10:01:00Z'),
    ...overrides,
  };
}

function makeDefaultFrom(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function makeDefaultTo(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function resetStore() {
  useSessionActivityStore.setState({
    logs:      [],
    from:      makeDefaultFrom(),
    to:        makeDefaultTo(),
    isLoading: false,
    error:     null,
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

describe('sessionActivityStore — fetchLogs', () => {
  it('sets isLoading true while fetching then false on success', async () => {
    const logs = [makeLog()];
    (getSessionActivityUseCase as jest.Mock).mockResolvedValue(logs);

    let loadingDuring = false;
    const unsubscribe = useSessionActivityStore.subscribe((state) => {
      if (state.isLoading) loadingDuring = true;
    });

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-1');
    });

    unsubscribe();

    expect(loadingDuring).toBe(true);
    expect(useSessionActivityStore.getState().isLoading).toBe(false);
  });

  it('stores logs returned by use case', async () => {
    const logs = [makeLog(), makeLog({ id: 'log-2' })];
    (getSessionActivityUseCase as jest.Mock).mockResolvedValue(logs);

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-1');
    });

    expect(useSessionActivityStore.getState().logs).toEqual(logs);
  });

  it('clears previous error on successful fetch', async () => {
    useSessionActivityStore.setState({ error: 'previous error' });
    (getSessionActivityUseCase as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-1');
    });

    expect(useSessionActivityStore.getState().error).toBeNull();
  });

  it('stores error message when use case throws', async () => {
    (getSessionActivityUseCase as jest.Mock).mockRejectedValue(new Error('fetch failed'));

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-1');
    });

    expect(useSessionActivityStore.getState().error).toBe('fetch failed');
    expect(useSessionActivityStore.getState().isLoading).toBe(false);
  });

  it('uses fallback error string when thrown error has no message', async () => {
    (getSessionActivityUseCase as jest.Mock).mockRejectedValue({});

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-1');
    });

    expect(useSessionActivityStore.getState().error).toBeTruthy();
  });

  it('does not overwrite logs on error — keeps previous logs', async () => {
    const previousLogs = [makeLog()];
    useSessionActivityStore.setState({ logs: previousLogs });
    (getSessionActivityUseCase as jest.Mock).mockRejectedValue(new Error('fetch failed'));

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-1');
    });

    expect(useSessionActivityStore.getState().logs).toEqual(previousLogs);
  });

  it('calls use case with coachId and current from/to dates', async () => {
    (getSessionActivityUseCase as jest.Mock).mockResolvedValue([]);
    const { from, to } = useSessionActivityStore.getState();

    await act(async () => {
      await useSessionActivityStore.getState().fetchLogs('coach-99');
    });

    expect(getSessionActivityUseCase).toHaveBeenCalledWith('coach-99', from, to, expect.anything());
  });
});

describe('sessionActivityStore — setFrom / setTo', () => {
  it('setFrom updates the from date', () => {
    const newFrom = new Date('2026-02-01T00:00:00Z');
    useSessionActivityStore.getState().setFrom(newFrom);

    expect(useSessionActivityStore.getState().from).toEqual(newFrom);
  });

  it('setTo updates the to date', () => {
    const newTo = new Date('2026-04-30T23:59:59Z');
    useSessionActivityStore.getState().setTo(newTo);

    expect(useSessionActivityStore.getState().to).toEqual(newTo);
  });
});

describe('sessionActivityStore — clearError', () => {
  it('sets error to null', () => {
    useSessionActivityStore.setState({ error: 'some error' });

    useSessionActivityStore.getState().clearError();

    expect(useSessionActivityStore.getState().error).toBeNull();
  });

  it('is idempotent when error is already null', () => {
    useSessionActivityStore.getState().clearError();

    expect(useSessionActivityStore.getState().error).toBeNull();
  });
});

describe('sessionActivityStore — initial state', () => {
  it('from is start of current month', () => {
    const state = useSessionActivityStore.getState();
    const from  = state.from;
    const now   = new Date();

    expect(from.getFullYear()).toBe(now.getFullYear());
    expect(from.getMonth()).toBe(now.getMonth());
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
  });

  it('to is end of current month', () => {
    const state   = useSessionActivityStore.getState();
    const to      = state.to;
    const now     = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    expect(to.getFullYear()).toBe(now.getFullYear());
    expect(to.getMonth()).toBe(now.getMonth());
    expect(to.getDate()).toBe(lastDay);
    expect(to.getHours()).toBe(23);
  });
});
