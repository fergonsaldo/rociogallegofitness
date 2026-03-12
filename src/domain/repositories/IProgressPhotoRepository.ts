import { ProgressPhoto, CreateProgressPhotoInput } from '../entities/ProgressPhoto';

export interface IProgressPhotoRepository {
  /** Returns all photos for an athlete ordered by takenAt asc */
  getByAthleteId(athleteId: string): Promise<ProgressPhoto[]>;

  /** Uploads image to Supabase Storage and inserts the metadata row */
  upload(input: CreateProgressPhotoInput, localUri: string): Promise<ProgressPhoto>;

  /** Deletes storage file and metadata row */
  delete(photo: ProgressPhoto): Promise<void>;
}
