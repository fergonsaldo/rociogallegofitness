import { IVideoRepository } from '@/domain/repositories/IVideoRepository';
import { Video, CreateVideoInput, CreateVideoSchema, UpdateVideoInput, UpdateVideoSchema } from '@/domain/entities/Video';
import { validateUUID } from '@/domain/validation/validateUUID';

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAllVideosUseCase(
  coachId: string,
  repo: IVideoRepository,
): Promise<Video[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getAll(coachId);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createVideoUseCase(
  input: CreateVideoInput,
  repo: IVideoRepository,
): Promise<Video> {
  CreateVideoSchema.parse(input);
  return repo.create(input);
}

export async function updateVideoUseCase(
  id: string,
  input: UpdateVideoInput,
  repo: IVideoRepository,
): Promise<Video> {
  if (!validateUUID(id)) throw new Error('Invalid video ID');
  UpdateVideoSchema.parse(input);
  return repo.update(id, input);
}

export async function deleteVideoUseCase(
  id: string,
  repo: IVideoRepository,
): Promise<void> {
  if (!validateUUID(id)) throw new Error('Invalid video ID');
  await repo.delete(id);
}

export async function setVideoVisibilityUseCase(
  videoId: string,
  visible: boolean,
  repo: IVideoRepository,
): Promise<void> {
  if (!validateUUID(videoId)) throw new Error('Invalid video ID');
  await repo.setVisibility(videoId, visible);
}

// ── Pure filter (exported for testing) ───────────────────────────────────────

export type VisibilityFilter = 'all' | 'visible' | 'hidden';

export function filterVideos(
  items: Video[],
  query: string,
  tags: string[],
  visibility: VisibilityFilter = 'all',
): Video[] {
  let result = items;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q),
    );
  }

  if (tags.length > 0) {
    result = result.filter((v) => tags.some((t) => v.tags.includes(t)));
  }

  if (visibility === 'visible') {
    result = result.filter((v) => v.visibleToClients);
  } else if (visibility === 'hidden') {
    result = result.filter((v) => !v.visibleToClients);
  }

  return result;
}
