/**
 * tagStore tests
 */

import { act } from 'react';
import { useTagStore } from '../../../src/presentation/stores/tagStore';
import { ClientTag } from '../../../src/domain/entities/ClientTag';

// ── Mock use cases ─────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/TagUseCases', () => ({
  getTagsUseCase:    jest.fn(),
  createTagUseCase:  jest.fn(),
  updateTagUseCase:  jest.fn(),
  deleteTagUseCase:  jest.fn(),
}));

import {
  getTagsUseCase, createTagUseCase, updateTagUseCase, deleteTagUseCase,
} from '../../../src/application/coach/TagUseCases';

const mockGetTags   = getTagsUseCase   as jest.MockedFunction<typeof getTagsUseCase>;
const mockCreate    = createTagUseCase as jest.MockedFunction<typeof createTagUseCase>;
const mockUpdate    = updateTagUseCase as jest.MockedFunction<typeof updateTagUseCase>;
const mockDelete    = deleteTagUseCase as jest.MockedFunction<typeof deleteTagUseCase>;

// ── Mock repo (store instantiates it internally) ──────────────────────────────

jest.mock('../../../src/infrastructure/supabase/remote/TagRemoteRepository', () => ({
  TagRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = 'coac-uuid-0001-0000-000000000001';
const NOW      = new Date();

const TAG_A: ClientTag = { id: 'tag-a', coachId: COACH_ID, name: 'Premium', color: '#C90960', clientCount: 3, createdAt: NOW };
const TAG_B: ClientTag = { id: 'tag-b', coachId: COACH_ID, name: 'VIP',     color: '#059669', clientCount: 1, createdAt: NOW };

function resetStore() {
  useTagStore.setState({ tags: [], isLoading: false, error: null });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetStore();
});

// ── fetchTags ─────────────────────────────────────────────────────────────────

describe('useTagStore — fetchTags', () => {
  it('sets tags on successful fetch', async () => {
    mockGetTags.mockResolvedValue([TAG_A, TAG_B]);

    await act(async () => {
      await useTagStore.getState().fetchTags(COACH_ID);
    });

    const state = useTagStore.getState();
    expect(state.tags).toHaveLength(2);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets isLoading true while fetching then false after', async () => {
    let resolve!: (v: ClientTag[]) => void;
    mockGetTags.mockReturnValue(new Promise((res) => { resolve = res; }));

    act(() => { useTagStore.getState().fetchTags(COACH_ID); });

    expect(useTagStore.getState().isLoading).toBe(true);

    await act(async () => { resolve([TAG_A]); });

    expect(useTagStore.getState().isLoading).toBe(false);
  });

  it('sets error on fetch failure', async () => {
    mockGetTags.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      await useTagStore.getState().fetchTags(COACH_ID);
    });

    const state = useTagStore.getState();
    expect(state.error).toBe('Network error');
    expect(state.tags).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('uses fallback error string when error has no message', async () => {
    mockGetTags.mockRejectedValue('unexpected');

    await act(async () => {
      await useTagStore.getState().fetchTags(COACH_ID);
    });

    expect(useTagStore.getState().error).toBe('Error al cargar las etiquetas');
  });

  it('clears previous error before fetching', async () => {
    useTagStore.setState({ error: 'old error' });
    mockGetTags.mockResolvedValue([]);

    await act(async () => { await useTagStore.getState().fetchTags(COACH_ID); });

    expect(useTagStore.getState().error).toBeNull();
  });
});

// ── createTag ─────────────────────────────────────────────────────────────────

describe('useTagStore — createTag', () => {
  it('adds new tag to sorted list', async () => {
    useTagStore.setState({ tags: [TAG_B] });
    mockCreate.mockResolvedValue(TAG_A);

    await act(async () => {
      await useTagStore.getState().createTag({ coachId: COACH_ID, name: 'Premium', color: '#C90960' });
    });

    const { tags } = useTagStore.getState();
    expect(tags).toHaveLength(2);
    expect(tags[0].name).toBe('Premium'); // P < V alphabetically
  });

  it('returns the created tag', async () => {
    mockCreate.mockResolvedValue(TAG_A);
    let result!: ClientTag;
    await act(async () => {
      result = await useTagStore.getState().createTag({ coachId: COACH_ID, name: 'Premium', color: '#C90960' });
    });
    expect(result.id).toBe('tag-a');
  });

  it('sets error and rethrows on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Duplicate'));

    await act(async () => {
      await expect(useTagStore.getState().createTag({ coachId: COACH_ID, name: 'VIP', color: '#059669' }))
        .rejects.toThrow('Duplicate');
    });

    expect(useTagStore.getState().error).toBe('Duplicate');
  });

  it('uses fallback error string when error has no message', async () => {
    mockCreate.mockRejectedValue('oops');

    await act(async () => {
      await expect(useTagStore.getState().createTag({ coachId: COACH_ID, name: 'VIP', color: '#059669' }))
        .rejects.toBeTruthy();
    });

    expect(useTagStore.getState().error).toBe('Error al crear la etiqueta');
  });
});

// ── updateTag ─────────────────────────────────────────────────────────────────

describe('useTagStore — updateTag', () => {
  it('replaces the tag in list and keeps it sorted', async () => {
    const updated = { ...TAG_A, name: 'AAA' };
    useTagStore.setState({ tags: [TAG_A, TAG_B] });
    mockUpdate.mockResolvedValue(updated);

    await act(async () => {
      await useTagStore.getState().updateTag('tag-a', { name: 'AAA' });
    });

    const { tags } = useTagStore.getState();
    expect(tags[0].name).toBe('AAA');
    expect(tags).toHaveLength(2);
  });

  it('returns the updated tag', async () => {
    const updated = { ...TAG_A, color: '#000000' };
    useTagStore.setState({ tags: [TAG_A] });
    mockUpdate.mockResolvedValue(updated);

    let result!: ClientTag;
    await act(async () => {
      result = await useTagStore.getState().updateTag('tag-a', { color: '#000000' });
    });
    expect(result.color).toBe('#000000');
  });

  it('sets error and rethrows on failure', async () => {
    useTagStore.setState({ tags: [TAG_A] });
    mockUpdate.mockRejectedValue(new Error('RLS error'));

    await act(async () => {
      await expect(useTagStore.getState().updateTag('tag-a', { name: 'X' }))
        .rejects.toThrow('RLS error');
    });

    expect(useTagStore.getState().error).toBe('RLS error');
  });
});

// ── deleteTag ─────────────────────────────────────────────────────────────────

describe('useTagStore — deleteTag', () => {
  it('removes the tag from list', async () => {
    useTagStore.setState({ tags: [TAG_A, TAG_B] });
    mockDelete.mockResolvedValue(undefined);

    await act(async () => {
      await useTagStore.getState().deleteTag('tag-a');
    });

    const { tags } = useTagStore.getState();
    expect(tags).toHaveLength(1);
    expect(tags[0].id).toBe('tag-b');
  });

  it('sets error and rethrows on failure', async () => {
    useTagStore.setState({ tags: [TAG_A] });
    mockDelete.mockRejectedValue(new Error('Delete failed'));

    await act(async () => {
      await expect(useTagStore.getState().deleteTag('tag-a')).rejects.toThrow('Delete failed');
    });

    expect(useTagStore.getState().error).toBe('Delete failed');
  });
});

// ── clearError ────────────────────────────────────────────────────────────────

describe('useTagStore — clearError', () => {
  it('clears the error field', () => {
    useTagStore.setState({ error: 'some error' });
    act(() => { useTagStore.getState().clearError(); });
    expect(useTagStore.getState().error).toBeNull();
  });

  it('does not affect tags or isLoading when clearing error', () => {
    useTagStore.setState({ tags: [TAG_A], isLoading: false, error: 'err' });
    act(() => { useTagStore.getState().clearError(); });
    const state = useTagStore.getState();
    expect(state.tags).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });
});
