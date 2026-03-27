import { act } from 'react';
import { useVideoStore } from '../../../src/presentation/stores/videoStore';
import { Video } from '../../../src/domain/entities/Video';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../../src/application/coach/VideoUseCases', () => ({
  getAllVideosUseCase:      jest.fn(),
  createVideoUseCase:      jest.fn(),
  deleteVideoUseCase:      jest.fn(),
  setVideoVisibilityUseCase: jest.fn(),
  filterVideos:            jest.fn(),
}));

jest.mock('../../../src/infrastructure/supabase/remote/VideoRemoteRepository', () => ({
  VideoRemoteRepository: jest.fn().mockImplementation(() => ({})),
}));

import {
  getAllVideosUseCase,
  createVideoUseCase,
  deleteVideoUseCase,
  setVideoVisibilityUseCase,
} from '../../../src/application/coach/VideoUseCases';

const mockGetAll       = getAllVideosUseCase      as jest.MockedFunction<typeof getAllVideosUseCase>;
const mockCreate       = createVideoUseCase       as jest.MockedFunction<typeof createVideoUseCase>;
const mockDelete       = deleteVideoUseCase       as jest.MockedFunction<typeof deleteVideoUseCase>;
const mockSetVisibility = setVideoVisibilityUseCase as jest.MockedFunction<typeof setVideoVisibilityUseCase>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = '00000000-0000-4000-b000-000000000001';
const NOW      = new Date();

function makeVideo(id: string, title = `Vídeo ${id}`, visibleToClients = false): Video {
  return {
    id,
    coachId:          COACH_ID,
    title,
    url:              'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags:             ['fuerza'],
    createdAt:        NOW,
    visibleToClients,
  };
}

const VIDEO_A = makeVideo('id-a', 'Abdominales avanzados');
const VIDEO_B = makeVideo('id-b', 'Bíceps con mancuernas');
const VIDEO_C = makeVideo('id-c', 'Cardio HIIT');

const VALID_INPUT = {
  coachId: COACH_ID,
  title:   'Nuevo vídeo',
  url:     'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  tags:    [] as string[],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useVideoStore.setState({
    catalog: [], isLoading: false, isCreating: false,
    error: null, visibilityFilter: 'all',
  });
}

beforeEach(() => { jest.clearAllMocks(); resetStore(); });

// ── fetchAll ──────────────────────────────────────────────────────────────────

describe('useVideoStore — fetchAll', () => {
  it('sets catalog on success', async () => {
    mockGetAll.mockResolvedValue([VIDEO_A, VIDEO_B]);
    await act(async () => { await useVideoStore.getState().fetchAll(COACH_ID); });
    expect(useVideoStore.getState().catalog).toHaveLength(2);
    expect(useVideoStore.getState().isLoading).toBe(false);
    expect(useVideoStore.getState().error).toBeNull();
  });

  it('sets isLoading true during fetch then false after', async () => {
    let resolve!: (v: Video[]) => void;
    mockGetAll.mockReturnValue(new Promise((res) => { resolve = res; }));
    act(() => { useVideoStore.getState().fetchAll(COACH_ID); });
    expect(useVideoStore.getState().isLoading).toBe(true);
    await act(async () => { resolve([VIDEO_A]); });
    expect(useVideoStore.getState().isLoading).toBe(false);
  });

  it('sets error on failure', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'));
    await act(async () => { await useVideoStore.getState().fetchAll(COACH_ID); });
    expect(useVideoStore.getState().error).toBe('Network error');
    expect(useVideoStore.getState().isLoading).toBe(false);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockGetAll.mockRejectedValue('unexpected');
    await act(async () => { await useVideoStore.getState().fetchAll(COACH_ID); });
    expect(useVideoStore.getState().error).toBe('Error al cargar los vídeos');
  });

  it('clears previous error before new fetch', async () => {
    useVideoStore.setState({ error: 'old error' });
    mockGetAll.mockResolvedValue([]);
    await act(async () => { await useVideoStore.getState().fetchAll(COACH_ID); });
    expect(useVideoStore.getState().error).toBeNull();
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('useVideoStore — create', () => {
  it('adds video to catalog sorted alphabetically', async () => {
    useVideoStore.setState({ catalog: [VIDEO_C] }); // 'Cardio HIIT'
    const newVideo = makeVideo('id-new', 'Abdominales rápidos'); // sorts before 'Cardio'
    mockCreate.mockResolvedValue(newVideo);
    await act(async () => { await useVideoStore.getState().create(VALID_INPUT); });
    expect(useVideoStore.getState().catalog[0].id).toBe('id-new');
  });

  it('returns null and sets error on failure', async () => {
    mockCreate.mockRejectedValue(new Error('Insert failed'));
    let result: Video | null = undefined as any;
    await act(async () => { result = await useVideoStore.getState().create(VALID_INPUT); });
    expect(result).toBeNull();
    expect(useVideoStore.getState().error).toBe('Insert failed');
  });

  it('sets isCreating true during creation then false after', async () => {
    let resolve!: (v: Video) => void;
    mockCreate.mockReturnValue(new Promise((res) => { resolve = res; }));
    act(() => { useVideoStore.getState().create(VALID_INPUT); });
    expect(useVideoStore.getState().isCreating).toBe(true);
    await act(async () => { resolve(makeVideo('x')); });
    expect(useVideoStore.getState().isCreating).toBe(false);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockCreate.mockRejectedValue('unexpected');
    await act(async () => { await useVideoStore.getState().create(VALID_INPUT); });
    expect(useVideoStore.getState().error).toBe('Error al crear el vídeo');
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('useVideoStore — delete', () => {
  it('removes video from catalog on success', async () => {
    useVideoStore.setState({ catalog: [VIDEO_A, VIDEO_B, VIDEO_C] });
    mockDelete.mockResolvedValue();
    await act(async () => { await useVideoStore.getState().delete('id-b'); });
    expect(useVideoStore.getState().catalog).toHaveLength(2);
    expect(useVideoStore.getState().catalog.find((v) => v.id === 'id-b')).toBeUndefined();
  });

  it('returns true on success', async () => {
    mockDelete.mockResolvedValue();
    let result!: boolean;
    await act(async () => { result = await useVideoStore.getState().delete('id-a'); });
    expect(result).toBe(true);
  });

  it('returns false and sets error on failure', async () => {
    mockDelete.mockRejectedValue(new Error('Cannot delete'));
    let result!: boolean;
    await act(async () => { result = await useVideoStore.getState().delete('id-b'); });
    expect(result).toBe(false);
    expect(useVideoStore.getState().error).toBe('Cannot delete');
  });

  it('does not modify catalog on failure', async () => {
    useVideoStore.setState({ catalog: [VIDEO_A, VIDEO_B] });
    mockDelete.mockRejectedValue(new Error('Error'));
    await act(async () => { await useVideoStore.getState().delete('id-b'); });
    expect(useVideoStore.getState().catalog).toHaveLength(2);
  });

  it('sets fallback error string when thrown value has no message', async () => {
    mockDelete.mockRejectedValue('unexpected');
    await act(async () => { await useVideoStore.getState().delete('id-a'); });
    expect(useVideoStore.getState().error).toBe('Error al eliminar el vídeo');
  });
});

// ── setVisibility ─────────────────────────────────────────────────────────────

describe('useVideoStore — setVisibility', () => {
  it('updates visibleToClients optimistically on success', async () => {
    useVideoStore.setState({ catalog: [makeVideo('id-a', 'A', false)] });
    mockSetVisibility.mockResolvedValue(undefined);
    await act(async () => { await useVideoStore.getState().setVisibility('id-a', true); });
    expect(useVideoStore.getState().catalog[0].visibleToClients).toBe(true);
  });

  it('returns true on success', async () => {
    useVideoStore.setState({ catalog: [makeVideo('id-a')] });
    mockSetVisibility.mockResolvedValue(undefined);
    let result!: boolean;
    await act(async () => { result = await useVideoStore.getState().setVisibility('id-a', true); });
    expect(result).toBe(true);
  });

  it('returns false and sets error on failure', async () => {
    useVideoStore.setState({ catalog: [makeVideo('id-a')] });
    mockSetVisibility.mockRejectedValue(new Error('RLS denied'));
    let result!: boolean;
    await act(async () => { result = await useVideoStore.getState().setVisibility('id-a', true); });
    expect(result).toBe(false);
    expect(useVideoStore.getState().error).toBe('RLS denied');
  });

  it('does not modify catalog on failure', async () => {
    useVideoStore.setState({ catalog: [makeVideo('id-a', 'A', false)] });
    mockSetVisibility.mockRejectedValue(new Error('Error'));
    await act(async () => { await useVideoStore.getState().setVisibility('id-a', true); });
    expect(useVideoStore.getState().catalog[0].visibleToClients).toBe(false);
  });
});

// ── setVisibilityFilter ───────────────────────────────────────────────────────

describe('useVideoStore — setVisibilityFilter', () => {
  it('updates visibilityFilter state', () => {
    useVideoStore.getState().setVisibilityFilter('visible');
    expect(useVideoStore.getState().visibilityFilter).toBe('visible');
  });

  it('can set to hidden', () => {
    useVideoStore.getState().setVisibilityFilter('hidden');
    expect(useVideoStore.getState().visibilityFilter).toBe('hidden');
  });

  it('can reset to all', () => {
    useVideoStore.setState({ visibilityFilter: 'hidden' });
    useVideoStore.getState().setVisibilityFilter('all');
    expect(useVideoStore.getState().visibilityFilter).toBe('all');
  });
});
