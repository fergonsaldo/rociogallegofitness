import { IVideoRepository } from '@/domain/repositories/IVideoRepository';
import { Video, CreateVideoInput, CreateVideoSchema } from '@/domain/entities/Video';
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

export async function deleteVideoUseCase(
  id: string,
  repo: IVideoRepository,
): Promise<void> {
  if (!validateUUID(id)) throw new Error('Invalid video ID');
  await repo.delete(id);
}

// ── Pure filter (exported for testing) ───────────────────────────────────────

export function filterVideos(
  items: Video[],
  query: string,
  tags: string[],
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

  return result;
}
