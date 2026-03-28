import { act } from 'react';
import { useCoachPreferencesStore } from '../../../src/presentation/stores/coachPreferencesStore';
import { DEFAULT_QUICK_ACCESS } from '../../../src/shared/constants/quickAccessCatalog';

jest.mock('../../../src/application/coach/CoachPreferencesUseCases', () => ({
  getQuickAccessUseCase:  jest.fn(),
  saveQuickAccessUseCase: jest.fn(),
  getActiveShortcuts:     jest.requireActual('../../../src/shared/constants/quickAccessCatalog').getActiveShortcuts,
  DEFAULT_QUICK_ACCESS:   jest.requireActual('../../../src/shared/constants/quickAccessCatalog').DEFAULT_QUICK_ACCESS,
}));

import {
  getQuickAccessUseCase,
  saveQuickAccessUseCase,
} from '../../../src/application/coach/CoachPreferencesUseCases';

function resetStore() {
  useCoachPreferencesStore.setState({
    quickAccess: DEFAULT_QUICK_ACCESS,
    isSaving:    false,
    error:       null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── loadQuickAccess ────────────────────────────────────────────────────────────

describe('coachPreferencesStore — loadQuickAccess', () => {
  it('sets quickAccess from use case result', async () => {
    const keys = ['clients', 'videos'];
    (getQuickAccessUseCase as jest.Mock).mockResolvedValue(keys);

    await act(async () => {
      await useCoachPreferencesStore.getState().loadQuickAccess('coach-1');
    });

    expect(useCoachPreferencesStore.getState().quickAccess).toEqual(keys);
  });

  it('keeps DEFAULT_QUICK_ACCESS when use case returns default (null row)', async () => {
    (getQuickAccessUseCase as jest.Mock).mockResolvedValue(DEFAULT_QUICK_ACCESS);

    await act(async () => {
      await useCoachPreferencesStore.getState().loadQuickAccess('coach-1');
    });

    expect(useCoachPreferencesStore.getState().quickAccess).toEqual(DEFAULT_QUICK_ACCESS);
  });

  it('sets error when use case throws', async () => {
    (getQuickAccessUseCase as jest.Mock).mockRejectedValue(new Error('load failed'));

    await act(async () => {
      await useCoachPreferencesStore.getState().loadQuickAccess('coach-1');
    });

    expect(useCoachPreferencesStore.getState().error).toBe('load failed');
  });

  it('uses fallback error string when thrown value has no message', async () => {
    (getQuickAccessUseCase as jest.Mock).mockRejectedValue({});

    await act(async () => {
      await useCoachPreferencesStore.getState().loadQuickAccess('coach-1');
    });

    expect(useCoachPreferencesStore.getState().error).toBeTruthy();
  });
});

// ── saveQuickAccess ────────────────────────────────────────────────────────────

describe('coachPreferencesStore — saveQuickAccess', () => {
  it('sets isSaving true while saving then false after', async () => {
    (saveQuickAccessUseCase as jest.Mock).mockResolvedValue(undefined);
    let loadingDuring = false;
    const unsub = useCoachPreferencesStore.subscribe((s) => {
      if (s.isSaving) loadingDuring = true;
    });

    await act(async () => {
      await useCoachPreferencesStore.getState().saveQuickAccess('coach-1', ['clients']);
    });

    unsub();
    expect(loadingDuring).toBe(true);
    expect(useCoachPreferencesStore.getState().isSaving).toBe(false);
  });

  it('updates quickAccess on success', async () => {
    const newKeys = ['calendar', 'videos'];
    (saveQuickAccessUseCase as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      await useCoachPreferencesStore.getState().saveQuickAccess('coach-1', newKeys);
    });

    expect(useCoachPreferencesStore.getState().quickAccess).toEqual(newKeys);
  });

  it('clears error before saving', async () => {
    useCoachPreferencesStore.setState({ error: 'previous error' });
    (saveQuickAccessUseCase as jest.Mock).mockResolvedValue(undefined);

    await act(async () => {
      await useCoachPreferencesStore.getState().saveQuickAccess('coach-1', ['clients']);
    });

    expect(useCoachPreferencesStore.getState().error).toBeNull();
  });

  it('sets error and stops isSaving when save fails', async () => {
    (saveQuickAccessUseCase as jest.Mock).mockRejectedValue(new Error('save failed'));

    await act(async () => {
      await useCoachPreferencesStore.getState().saveQuickAccess('coach-1', ['clients']);
    });

    expect(useCoachPreferencesStore.getState().error).toBe('save failed');
    expect(useCoachPreferencesStore.getState().isSaving).toBe(false);
  });

  it('does not update quickAccess on failure', async () => {
    (saveQuickAccessUseCase as jest.Mock).mockRejectedValue(new Error('save failed'));
    const original = useCoachPreferencesStore.getState().quickAccess;

    await act(async () => {
      await useCoachPreferencesStore.getState().saveQuickAccess('coach-1', ['videos']);
    });

    expect(useCoachPreferencesStore.getState().quickAccess).toEqual(original);
  });
});

// ── clearError ─────────────────────────────────────────────────────────────────

describe('coachPreferencesStore — clearError', () => {
  it('sets error to null', () => {
    useCoachPreferencesStore.setState({ error: 'some error' });
    useCoachPreferencesStore.getState().clearError();
    expect(useCoachPreferencesStore.getState().error).toBeNull();
  });
});
