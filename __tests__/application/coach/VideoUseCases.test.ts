import {
  getAllVideosUseCase,
  createVideoUseCase,
  updateVideoUseCase,
  deleteVideoUseCase,
  setVideoVisibilityUseCase,
  filterVideos,
} from '../../../src/application/coach/VideoUseCases';
import { IVideoRepository } from '../../../src/domain/repositories/IVideoRepository';
import { Video, CreateVideoInput } from '../../../src/domain/entities/Video';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID = '00000000-0000-4000-b000-000000000001';
const VIDEO_ID = '11111111-0000-4000-b000-000000000002';
const NOW      = new Date();

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id:               VIDEO_ID,
    coachId:          COACH_ID,
    title:            'Press de banca tutorial',
    url:              'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags:             ['fuerza', 'pecho'],
    description:      'Tutorial completo',
    createdAt:        NOW,
    visibleToClients: false,
    ...overrides,
  };
}

const VALID_INPUT: CreateVideoInput = {
  coachId:     COACH_ID,
  title:       'Press de banca tutorial',
  url:         'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  tags:        ['fuerza', 'pecho'],
  description: 'Tutorial completo',
};

const mockRepo: jest.Mocked<IVideoRepository> = {
  getAll:         jest.fn(),
  create:         jest.fn(),
  update:         jest.fn(),
  delete:         jest.fn(),
  setVisibility:  jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getAllVideosUseCase ────────────────────────────────────────────────────────

describe('getAllVideosUseCase', () => {
  it('returns videos from repository', async () => {
    mockRepo.getAll.mockResolvedValue([makeVideo()]);
    const result = await getAllVideosUseCase(COACH_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(mockRepo.getAll).toHaveBeenCalledWith(COACH_ID);
  });

  it('throws when coachId is empty', async () => {
    await expect(getAllVideosUseCase('', mockRepo)).rejects.toThrow('coachId is required');
    expect(mockRepo.getAll).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.getAll.mockRejectedValue(new Error('DB error'));
    await expect(getAllVideosUseCase(COACH_ID, mockRepo)).rejects.toThrow('DB error');
  });

  it('returns empty array when repository returns empty', async () => {
    mockRepo.getAll.mockResolvedValue([]);
    const result = await getAllVideosUseCase(COACH_ID, mockRepo);
    expect(result).toEqual([]);
  });
});

// ── createVideoUseCase ────────────────────────────────────────────────────────

describe('createVideoUseCase', () => {
  it('calls repo with valid input and returns video', async () => {
    const video = makeVideo();
    mockRepo.create.mockResolvedValue(video);
    const result = await createVideoUseCase(VALID_INPUT, mockRepo);
    expect(result).toEqual(video);
    expect(mockRepo.create).toHaveBeenCalledWith(VALID_INPUT);
  });

  it('throws when title is empty', async () => {
    await expect(
      createVideoUseCase({ ...VALID_INPUT, title: '' }, mockRepo),
    ).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when URL is not a YouTube URL', async () => {
    await expect(
      createVideoUseCase({ ...VALID_INPUT, url: 'https://vimeo.com/12345' }, mockRepo),
    ).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('throws when URL is not a valid URL', async () => {
    await expect(
      createVideoUseCase({ ...VALID_INPUT, url: 'not-a-url' }, mockRepo),
    ).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('accepts youtu.be short URLs', async () => {
    mockRepo.create.mockResolvedValue(makeVideo({ url: 'https://youtu.be/dQw4w9WgXcQ' }));
    await expect(
      createVideoUseCase({ ...VALID_INPUT, url: 'https://youtu.be/dQw4w9WgXcQ' }, mockRepo),
    ).resolves.not.toThrow();
  });

  it('accepts videos without tags', async () => {
    mockRepo.create.mockResolvedValue(makeVideo({ tags: [] }));
    await expect(
      createVideoUseCase({ ...VALID_INPUT, tags: [] }, mockRepo),
    ).resolves.not.toThrow();
  });

  it('propagates repository errors', async () => {
    mockRepo.create.mockRejectedValue(new Error('Insert failed'));
    await expect(createVideoUseCase(VALID_INPUT, mockRepo)).rejects.toThrow('Insert failed');
  });
});

// ── updateVideoUseCase ────────────────────────────────────────────────────────

describe('updateVideoUseCase', () => {
  it('calls repo.update with id and input and returns updated video', async () => {
    const updated = makeVideo({ title: 'Actualizado' });
    mockRepo.update.mockResolvedValue(updated);
    const result = await updateVideoUseCase(VIDEO_ID, { title: 'Actualizado' }, mockRepo);
    expect(result).toEqual(updated);
    expect(mockRepo.update).toHaveBeenCalledWith(VIDEO_ID, { title: 'Actualizado' });
  });

  it('throws when id is not a valid UUID', async () => {
    await expect(updateVideoUseCase('not-a-uuid', { title: 'X' }, mockRepo))
      .rejects.toThrow('Invalid video ID');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when id is empty', async () => {
    await expect(updateVideoUseCase('', { title: 'X' }, mockRepo))
      .rejects.toThrow('Invalid video ID');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when title is provided but empty', async () => {
    await expect(updateVideoUseCase(VIDEO_ID, { title: '' }, mockRepo)).rejects.toThrow();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('throws when url is provided but not a YouTube URL', async () => {
    await expect(updateVideoUseCase(VIDEO_ID, { url: 'https://vimeo.com/123' }, mockRepo))
      .rejects.toThrow();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('succeeds with empty object (no changes)', async () => {
    const original = makeVideo();
    mockRepo.update.mockResolvedValue(original);
    await expect(updateVideoUseCase(VIDEO_ID, {}, mockRepo)).resolves.not.toThrow();
  });

  it('propagates repository errors', async () => {
    mockRepo.update.mockRejectedValue(new Error('Update failed'));
    await expect(updateVideoUseCase(VIDEO_ID, { title: 'X' }, mockRepo))
      .rejects.toThrow('Update failed');
  });
});

// ── deleteVideoUseCase ────────────────────────────────────────────────────────

describe('deleteVideoUseCase', () => {
  it('calls repo delete with valid id', async () => {
    mockRepo.delete.mockResolvedValue();
    await deleteVideoUseCase(VIDEO_ID, mockRepo);
    expect(mockRepo.delete).toHaveBeenCalledWith(VIDEO_ID);
  });

  it('throws when id is not a valid UUID', async () => {
    await expect(deleteVideoUseCase('not-a-uuid', mockRepo)).rejects.toThrow('Invalid video ID');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('throws when id is empty', async () => {
    await expect(deleteVideoUseCase('', mockRepo)).rejects.toThrow('Invalid video ID');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Cannot delete'));
    await expect(deleteVideoUseCase(VIDEO_ID, mockRepo)).rejects.toThrow('Cannot delete');
  });
});

// ── setVideoVisibilityUseCase ─────────────────────────────────────────────────

describe('setVideoVisibilityUseCase', () => {
  it('calls repo.setVisibility with correct params when making visible', async () => {
    mockRepo.setVisibility.mockResolvedValue(undefined);
    await setVideoVisibilityUseCase(VIDEO_ID, true, mockRepo);
    expect(mockRepo.setVisibility).toHaveBeenCalledWith(VIDEO_ID, true);
  });

  it('calls repo.setVisibility with false when hiding', async () => {
    mockRepo.setVisibility.mockResolvedValue(undefined);
    await setVideoVisibilityUseCase(VIDEO_ID, false, mockRepo);
    expect(mockRepo.setVisibility).toHaveBeenCalledWith(VIDEO_ID, false);
  });

  it('throws when videoId is not a valid UUID', async () => {
    await expect(setVideoVisibilityUseCase('not-a-uuid', true, mockRepo))
      .rejects.toThrow('Invalid video ID');
    expect(mockRepo.setVisibility).not.toHaveBeenCalled();
  });

  it('throws when videoId is empty', async () => {
    await expect(setVideoVisibilityUseCase('', true, mockRepo))
      .rejects.toThrow('Invalid video ID');
    expect(mockRepo.setVisibility).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    mockRepo.setVisibility.mockRejectedValue(new Error('RLS denied'));
    await expect(setVideoVisibilityUseCase(VIDEO_ID, true, mockRepo))
      .rejects.toThrow('RLS denied');
  });
});

// ── filterVideos ──────────────────────────────────────────────────────────────

const VIDEO_FUERZA = makeVideo({
  id: 'v-1', title: 'Press de banca tutorial',
  tags: ['fuerza', 'pecho'], description: 'Ejercicio de empuje',
  visibleToClients: true,
});
const VIDEO_CARDIO = makeVideo({
  id: 'v-2', title: 'HIIT 20 minutos',
  tags: ['cardio', 'quemagrasa'], description: 'Alta intensidad',
  visibleToClients: false,
});
const VIDEO_MOVILIDAD = makeVideo({
  id: 'v-3', title: 'Movilidad de hombros',
  tags: ['movilidad', 'calentamiento'], description: '',
  visibleToClients: false,
});

describe('filterVideos — no filters', () => {
  it('returns all items when query is empty and no tags active', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD], '', []);
    expect(result).toHaveLength(3);
  });

  it('returns all items when query is only whitespace', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO], '   ', []);
    expect(result).toHaveLength(2);
  });

  it('returns empty array when input list is empty', () => {
    expect(filterVideos([], 'fuerza', [])).toEqual([]);
  });
});

describe('filterVideos — text search', () => {
  it('filters by title (case-insensitive)', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD], 'hiit', []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-2');
  });

  it('trims leading and trailing spaces from query before filtering', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD], '  HIIT  ', []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-2');
  });

  it('filters by description', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO], 'empuje', []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-1');
  });

  it('returns empty array when no title or description matches', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO], 'baloncesto', []);
    expect(result).toHaveLength(0);
  });
});

describe('filterVideos — tag filter', () => {
  it('filters by single tag', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD], '', ['cardio']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-2');
  });

  it('uses OR logic for multiple tags', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD], '', ['fuerza', 'movilidad']);
    expect(result).toHaveLength(2);
    expect(result.map((v) => v.id)).toContain('v-1');
    expect(result.map((v) => v.id)).toContain('v-3');
  });

  it('returns empty when tag does not match any video', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO], '', ['nutricion']);
    expect(result).toHaveLength(0);
  });

  it('does not match partial tag names', () => {
    const result = filterVideos([VIDEO_FUERZA], '', ['fuerz']);
    expect(result).toHaveLength(0);
  });
});

describe('filterVideos — combined text + tag', () => {
  it('applies text and tag filters together', () => {
    const result = filterVideos([VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD], 'tutorial', ['fuerza']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-1');
  });

  it('returns empty when text matches but tag does not', () => {
    const result = filterVideos([VIDEO_FUERZA], 'press', ['cardio']);
    expect(result).toHaveLength(0);
  });
});

describe('filterVideos — visibility filter', () => {
  const ALL = [VIDEO_FUERZA, VIDEO_CARDIO, VIDEO_MOVILIDAD];

  it('returns all videos when visibility is "all"', () => {
    expect(filterVideos(ALL, '', [], 'all')).toHaveLength(3);
  });

  it('returns only visible videos when visibility is "visible"', () => {
    const result = filterVideos(ALL, '', [], 'visible');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-1');
  });

  it('returns only hidden videos when visibility is "hidden"', () => {
    const result = filterVideos(ALL, '', [], 'hidden');
    expect(result).toHaveLength(2);
    expect(result.map((v) => v.id)).not.toContain('v-1');
  });

  it('defaults to "all" when visibility param is omitted', () => {
    expect(filterVideos(ALL, '', [])).toHaveLength(3);
  });

  it('combines visibility with text search', () => {
    const result = filterVideos(ALL, 'HIIT', [], 'hidden');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('v-2');
  });

  it('returns empty when visibility filter matches nothing', () => {
    const allHidden = ALL.map((v) => ({ ...v, visibleToClients: false }));
    expect(filterVideos(allHidden, '', [], 'visible')).toHaveLength(0);
  });
});
