/**
 * coachDashboardStore tests
 */

import { act } from 'react';
import { useCoachDashboardStore } from '../../../src/presentation/stores/coachDashboardStore';
import { CoachDashboardSummary } from '../../../src/domain/repositories/ICoachRepository';

// ── Mock use case ─────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/ClientUseCases', () => ({
  getCoachDashboardSummaryUseCase: jest.fn(),
}));

import { getCoachDashboardSummaryUseCase } from '../../../src/application/coach/ClientUseCases';
const mockGetSummary = getCoachDashboardSummaryUseCase as jest.MockedFunction<
  typeof getCoachDashboardSummaryUseCase
>;

// ── Mock repository (store instantiates it internally — we mock the use case layer) ──

jest.mock('../../../src/infrastructure/supabase/remote/CoachRemoteRepository', () => ({
  CoachRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const NOW = new Date();

const SUMMARY: CoachDashboardSummary = {
  totalAthletes: 3,
  activeAthletesThisWeek: 2,
  recentSessions: [
    {
      sessionId: 'sess-001',
      athleteId: 'athl-001',
      athleteName: 'Ana García',
      startedAt: NOW,
      status: 'completed',
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useCoachDashboardStore.setState({ summary: null, isLoading: false, error: null });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

describe('useCoachDashboardStore — fetchDashboardSummary', () => {
  it('sets summary on successful fetch', async () => {
    mockGetSummary.mockResolvedValue(SUMMARY);

    await act(async () => {
      await useCoachDashboardStore.getState().fetchDashboardSummary(COACH_ID);
    });

    const state = useCoachDashboardStore.getState();
    expect(state.summary).toEqual(SUMMARY);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets isLoading to true while fetching then false after', async () => {
    let resolvePromise!: (v: CoachDashboardSummary) => void;
    mockGetSummary.mockReturnValue(new Promise((res) => { resolvePromise = res; }));

    act(() => {
      useCoachDashboardStore.getState().fetchDashboardSummary(COACH_ID);
    });

    expect(useCoachDashboardStore.getState().isLoading).toBe(true);

    await act(async () => { resolvePromise(SUMMARY); });

    expect(useCoachDashboardStore.getState().isLoading).toBe(false);
  });

  it('sets error message on fetch failure', async () => {
    mockGetSummary.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useCoachDashboardStore.getState().fetchDashboardSummary(COACH_ID);
    });

    const state = useCoachDashboardStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.summary).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('sets fallback error string when error has no message', async () => {
    mockGetSummary.mockRejectedValue('unexpected');

    await act(async () => {
      await useCoachDashboardStore.getState().fetchDashboardSummary(COACH_ID);
    });

    expect(useCoachDashboardStore.getState().error).toBe(
      'Error al cargar el resumen del dashboard',
    );
  });

  it('clears previous error before a new fetch', async () => {
    useCoachDashboardStore.setState({ error: 'old error' });
    mockGetSummary.mockResolvedValue(SUMMARY);

    await act(async () => {
      await useCoachDashboardStore.getState().fetchDashboardSummary(COACH_ID);
    });

    expect(useCoachDashboardStore.getState().error).toBeNull();
  });

  it('calls use case with the provided coachId', async () => {
    mockGetSummary.mockResolvedValue(SUMMARY);

    await act(async () => {
      await useCoachDashboardStore.getState().fetchDashboardSummary(COACH_ID);
    });

    expect(mockGetSummary).toHaveBeenCalledWith(COACH_ID, expect.anything());
  });
});

describe('useCoachDashboardStore — clearError', () => {
  it('clears the error field', () => {
    useCoachDashboardStore.setState({ error: 'some error' });

    act(() => {
      useCoachDashboardStore.getState().clearError();
    });

    expect(useCoachDashboardStore.getState().error).toBeNull();
  });

  it('does not affect summary or isLoading when clearing error', () => {
    useCoachDashboardStore.setState({ summary: SUMMARY, isLoading: false, error: 'err' });

    act(() => {
      useCoachDashboardStore.getState().clearError();
    });

    const state = useCoachDashboardStore.getState();
    expect(state.summary).toEqual(SUMMARY);
    expect(state.isLoading).toBe(false);
  });
});
