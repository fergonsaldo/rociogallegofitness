/**
 * scheduleStore tests (RF-E8-04)
 */

import { act } from 'react';
import { useScheduleStore } from '../../../src/presentation/stores/scheduleStore';
import { Schedule } from '../../../src/domain/entities/Schedule';

// ── Mock use cases ─────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/ScheduleUseCases', () => ({
  getSchedulesUseCase:          jest.fn(),
  createScheduleUseCase:        jest.fn(),
  toggleScheduleActiveUseCase:  jest.fn(),
  deleteScheduleUseCase:        jest.fn(),
  calculateTotalSlots:          jest.fn(),
}));

import {
  getSchedulesUseCase,
  createScheduleUseCase,
  toggleScheduleActiveUseCase,
  deleteScheduleUseCase,
} from '../../../src/application/coach/ScheduleUseCases';

const mockGetAll    = getSchedulesUseCase         as jest.MockedFunction<typeof getSchedulesUseCase>;
const mockCreate    = createScheduleUseCase       as jest.MockedFunction<typeof createScheduleUseCase>;
const mockToggle    = toggleScheduleActiveUseCase as jest.MockedFunction<typeof toggleScheduleActiveUseCase>;
const mockDelete    = deleteScheduleUseCase       as jest.MockedFunction<typeof deleteScheduleUseCase>;

// ── Mock repo ─────────────────────────────────────────────────────────────────

jest.mock('../../../src/infrastructure/supabase/remote/ScheduleRemoteRepository', () => ({
  ScheduleRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const NOW      = new Date();

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id:                   'sche-a',
    coachId:              COACH_ID,
    title:                'Mañanas',
    startDate:            new Date('2026-04-01'),
    endDate:              new Date('2026-04-30'),
    startTime:            '09:00',
    endTime:              '18:00',
    slotDurationMinutes:  60,
    modality:             'in_person',
    isActive:             true,
    createdAt:            NOW,
    ...overrides,
  };
}

const SCHED_A = makeSchedule({ id: 'sche-a', title: 'Mañanas', startDate: new Date('2026-04-01') });
const SCHED_B = makeSchedule({ id: 'sche-b', title: 'Tardes',  startDate: new Date('2026-05-01') });

function resetStore() {
  useScheduleStore.setState({ schedules: [], isLoading: false, error: null });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── fetchSchedules ────────────────────────────────────────────────────────────

describe('useScheduleStore — fetchSchedules', () => {
  it('sets schedules on successful fetch', async () => {
    mockGetAll.mockResolvedValue([SCHED_A, SCHED_B]);

    await act(async () => {
      await useScheduleStore.getState().fetchSchedules(COACH_ID);
    });

    const state = useScheduleStore.getState();
    expect(state.schedules).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets isLoading true while fetching then false after', async () => {
    let resolve!: (v: Schedule[]) => void;
    mockGetAll.mockReturnValue(new Promise((res) => { resolve = res; }));

    act(() => { useScheduleStore.getState().fetchSchedules(COACH_ID); });

    expect(useScheduleStore.getState().isLoading).toBe(true);

    await act(async () => { resolve([SCHED_A]); });

    expect(useScheduleStore.getState().isLoading).toBe(false);
  });

  it('sets error on fetch failure', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useScheduleStore.getState().fetchSchedules(COACH_ID);
    });

    const state = useScheduleStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.schedules).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('uses fallback error string when error has no message', async () => {
    mockGetAll.mockRejectedValue('unexpected');

    await act(async () => {
      await useScheduleStore.getState().fetchSchedules(COACH_ID);
    });

    expect(useScheduleStore.getState().error).toBe('Error al cargar los horarios');
  });

  it('clears previous error before fetching', async () => {
    useScheduleStore.setState({ error: 'old error' });
    mockGetAll.mockResolvedValue([]);

    await act(async () => {
      await useScheduleStore.getState().fetchSchedules(COACH_ID);
    });

    expect(useScheduleStore.getState().error).toBeNull();
  });
});

// ── createSchedule ────────────────────────────────────────────────────────────

describe('useScheduleStore — createSchedule', () => {
  const input = {
    coachId: COACH_ID, title: 'Mañanas',
    startDate: new Date('2026-04-01'), endDate: new Date('2026-04-30'),
    startTime: '09:00', endTime: '18:00',
    slotDurationMinutes: 60, modality: 'in_person' as const, isActive: true,
  };

  it('adds schedule to list sorted by startDate', async () => {
    useScheduleStore.setState({ schedules: [SCHED_B] });
    mockCreate.mockResolvedValue(SCHED_A);

    await act(async () => {
      await useScheduleStore.getState().createSchedule(input);
    });

    const { schedules } = useScheduleStore.getState();
    expect(schedules).toHaveLength(2);
    expect(schedules[0].id).toBe('sche-a'); // earlier startDate
  });

  it('returns the created schedule', async () => {
    mockCreate.mockResolvedValue(SCHED_A);
    let result!: Schedule;
    await act(async () => {
      result = await useScheduleStore.getState().createSchedule(input);
    });
    expect(result.id).toBe('sche-a');
  });

  it('sets error and rethrows on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Date range invalid'));

    await act(async () => {
      await expect(useScheduleStore.getState().createSchedule(input))
        .rejects.toThrow('Date range invalid');
    });

    expect(useScheduleStore.getState().error).toBe('Date range invalid');
  });

  it('uses fallback error string when error has no message', async () => {
    mockCreate.mockRejectedValue('oops');

    await act(async () => {
      await expect(useScheduleStore.getState().createSchedule(input))
        .rejects.toBeTruthy();
    });

    expect(useScheduleStore.getState().error).toBe('Error al crear el horario');
  });
});

// ── toggleActive ──────────────────────────────────────────────────────────────

describe('useScheduleStore — toggleActive', () => {
  it('updates isActive on the schedule in list', async () => {
    useScheduleStore.setState({ schedules: [SCHED_A] });
    const deactivated = makeSchedule({ id: 'sche-a', isActive: false });
    mockToggle.mockResolvedValue(deactivated);

    await act(async () => {
      await useScheduleStore.getState().toggleActive('sche-a', false);
    });

    expect(useScheduleStore.getState().schedules[0].isActive).toBe(false);
  });

  it('sets error and rethrows on failure', async () => {
    useScheduleStore.setState({ schedules: [SCHED_A] });
    mockToggle.mockRejectedValue(new Error('RLS error'));

    await act(async () => {
      await expect(useScheduleStore.getState().toggleActive('sche-a', false))
        .rejects.toThrow('RLS error');
    });

    expect(useScheduleStore.getState().error).toBe('RLS error');
  });

  it('uses fallback error string when error has no message', async () => {
    useScheduleStore.setState({ schedules: [SCHED_A] });
    mockToggle.mockRejectedValue('oops');

    await act(async () => {
      await expect(useScheduleStore.getState().toggleActive('sche-a', false))
        .rejects.toBeTruthy();
    });

    expect(useScheduleStore.getState().error).toBe('Error al actualizar el horario');
  });
});

// ── deleteSchedule ────────────────────────────────────────────────────────────

describe('useScheduleStore — deleteSchedule', () => {
  it('removes the schedule from list', async () => {
    useScheduleStore.setState({ schedules: [SCHED_A, SCHED_B] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useScheduleStore.getState().deleteSchedule('sche-a');
    });

    const { schedules } = useScheduleStore.getState();
    expect(schedules).toHaveLength(1);
    expect(schedules[0].id).toBe('sche-b');
  });

  it('sets error and rethrows on failure', async () => {
    useScheduleStore.setState({ schedules: [SCHED_A] });
    mockDelete.mockRejectedValue(new Error('Delete failed'));

    await act(async () => {
      await expect(useScheduleStore.getState().deleteSchedule('sche-a'))
        .rejects.toThrow('Delete failed');
    });

    expect(useScheduleStore.getState().error).toBe('Delete failed');
  });

  it('uses fallback error string when error has no message', async () => {
    useScheduleStore.setState({ schedules: [SCHED_A] });
    mockDelete.mockRejectedValue('oops');

    await act(async () => {
      await expect(useScheduleStore.getState().deleteSchedule('sche-a'))
        .rejects.toBeTruthy();
    });

    expect(useScheduleStore.getState().error).toBe('Error al eliminar el horario');
  });
});

// ── clearError ────────────────────────────────────────────────────────────────

describe('useScheduleStore — clearError', () => {
  it('clears the error field', () => {
    useScheduleStore.setState({ error: 'some error' });
    act(() => { useScheduleStore.getState().clearError(); });
    expect(useScheduleStore.getState().error).toBeNull();
  });

  it('does not affect schedules or isLoading when clearing error', () => {
    useScheduleStore.setState({ schedules: [SCHED_A], isLoading: false, error: 'err' });
    act(() => { useScheduleStore.getState().clearError(); });
    const state = useScheduleStore.getState();
    expect(state.schedules).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });
});
