import { Video, CreateVideoInput } from '@/domain/entities/Video';

export interface IVideoRepository {
  getAll(coachId: string): Promise<Video[]>;
  create(input: CreateVideoInput): Promise<Video>;
  delete(id: string): Promise<void>;
}
