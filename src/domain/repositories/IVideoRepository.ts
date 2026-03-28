import { Video, CreateVideoInput, UpdateVideoInput } from '@/domain/entities/Video';

export interface IVideoRepository {
  getAll(coachId: string): Promise<Video[]>;
  create(input: CreateVideoInput): Promise<Video>;
  update(id: string, input: UpdateVideoInput): Promise<Video>;
  delete(id: string): Promise<void>;
  setVisibility(videoId: string, visible: boolean): Promise<void>;
}
