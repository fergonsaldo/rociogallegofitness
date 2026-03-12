import { IProgressPhotoRepository } from '@/domain/repositories/IProgressPhotoRepository';
import {
  ProgressPhoto,
  CreateProgressPhotoInput,
  CreateProgressPhotoSchema,
} from '@/domain/entities/ProgressPhoto';

export async function getProgressPhotosUseCase(
  athleteId: string,
  repo: IProgressPhotoRepository,
): Promise<ProgressPhoto[]> {
  if (!athleteId) throw new Error('athleteId is required');
  return repo.getByAthleteId(athleteId);
}

export async function uploadProgressPhotoUseCase(
  input: CreateProgressPhotoInput,
  localUri: string,
  repo: IProgressPhotoRepository,
): Promise<ProgressPhoto> {
  CreateProgressPhotoSchema.parse(input);
  if (!localUri) throw new Error('localUri is required');
  return repo.upload(input, localUri);
}

export async function deleteProgressPhotoUseCase(
  photo: ProgressPhoto,
  repo: IProgressPhotoRepository,
): Promise<void> {
  if (!photo.id) throw new Error('photo.id is required');
  return repo.delete(photo);
}
