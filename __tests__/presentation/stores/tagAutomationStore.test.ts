/**
 * tagAutomationStore tests — RF-E2-06b
 */

import { act, renderHook } from '@testing-library/react-native';
import { useTagAutomationStore } from '../../../src/presentation/stores/tagAutomationStore';
import * as UseCases from '../../../src/application/coach/TagAutomationUseCases';
import { TagAutomation } from '../../../src/domain/entities/TagAutomation';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/TagAutomationUseCases');
jest.mock('../../../src/infrastructure/supabase/remote/TagAutomationRemoteRepository');

const mockGet    = UseCases.getTagAutomationUseCase    as jest.MockedFunction<typeof UseCases.getTagAutomationUseCase>;
const mockSave   = UseCases.saveTagAutomationUseCase   as jest.MockedFunction<typeof UseCases.saveTagAutomationUseCase>;
const mockDelete = UseCases.deleteTagAutomationUseCase as jest.MockedFunction<typeof UseCases.deleteTagAutomationUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TAG_ID     = '00000000-0000-4000-b000-000000000001';
const ROUTINE_ID = '00000000-0000-4000-b000-000000000002';

const AUTOMATION: TagAutomation = {
  id:              '00000000-0000-4000-b000-000000000010',
  tagId:           TAG_ID,
  routineId:       ROUTINE_ID,
  cardioId:        null,
  nutritionPlanId: null,
  createdAt:       new Date(),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStore() {
  return renderHook(() => useTagAutomationStore()).result;
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store state between tests
  useTagAutomationStore.setState({ automations: {}, isSaving: false, error: null });
});

// ── fetchAutomation ───────────────────────────────────────────────────────────

describe('fetchAutomation', () => {
  it('stores the automation when found', async () => {
    mockGet.mockResolvedValue(AUTOMATION);
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => { await result.current.fetchAutomation(TAG_ID); });

    expect(result.current.automations[TAG_ID]).toEqual(AUTOMATION);
  });

  it('stores null when no automation configured', async () => {
    mockGet.mockResolvedValue(null);
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => { await result.current.fetchAutomation(TAG_ID); });

    expect(result.current.automations[TAG_ID]).toBeNull();
  });

  it('stores error message on failure', async () => {
    mockGet.mockRejectedValue(new Error('DB error'));
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => { await result.current.fetchAutomation(TAG_ID); });

    expect(result.current.error).toBe('DB error');
  });
});

// ── saveAutomation ────────────────────────────────────────────────────────────

describe('saveAutomation', () => {
  it('updates the store after successful save', async () => {
    mockSave.mockResolvedValue(AUTOMATION);
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => {
      await result.current.saveAutomation(TAG_ID, { routineId: ROUTINE_ID });
    });

    expect(result.current.automations[TAG_ID]).toEqual(AUTOMATION);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isSaving to false and stores error on failure', async () => {
    mockSave.mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => {
      try { await result.current.saveAutomation(TAG_ID, {}); } catch { /* expected */ }
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBe('Save failed');
  });

  it('rethrows error so the UI can react', async () => {
    mockSave.mockRejectedValue(new Error('Save failed'));
    const { result } = renderHook(() => useTagAutomationStore());

    await expect(
      act(async () => { await result.current.saveAutomation(TAG_ID, {}); }),
    ).rejects.toThrow('Save failed');
  });
});

// ── deleteAutomation ──────────────────────────────────────────────────────────

describe('deleteAutomation', () => {
  it('clears the cached automation on success', async () => {
    useTagAutomationStore.setState({ automations: { [TAG_ID]: AUTOMATION } });
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => { await result.current.deleteAutomation(TAG_ID); });

    expect(result.current.automations[TAG_ID]).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it('stores error on failure', async () => {
    mockDelete.mockRejectedValue(new Error('Delete error'));
    const { result } = renderHook(() => useTagAutomationStore());

    await act(async () => {
      try { await result.current.deleteAutomation(TAG_ID); } catch { /* expected */ }
    });

    expect(result.current.error).toBe('Delete error');
  });

  it('rethrows error so the UI can react', async () => {
    mockDelete.mockRejectedValue(new Error('Delete error'));
    const { result } = renderHook(() => useTagAutomationStore());

    let thrown: unknown;
    await act(async () => {
      try { await result.current.deleteAutomation(TAG_ID); } catch (e) { thrown = e; }
    });

    expect((thrown as Error).message).toBe('Delete error');
  });
});

// ── clearError ────────────────────────────────────────────────────────────────

describe('clearError', () => {
  it('clears the error state', () => {
    useTagAutomationStore.setState({ error: 'some error' });
    const { result } = renderHook(() => useTagAutomationStore());

    act(() => { result.current.clearError(); });

    expect(result.current.error).toBeNull();
  });
});
