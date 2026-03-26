import { supabase } from '../client';
import { IProgressPhotoRepository } from '@/domain/repositories/IProgressPhotoRepository';
import { ProgressPhoto, CreateProgressPhotoInput } from '@/domain/entities/ProgressPhoto';
import { ProgressPhotoRow } from '../database.types';

const BUCKET             = 'progress-photos';
const SIGNED_URL_EXPIRES = 60 * 60; // 1 hour in seconds

export class ProgressPhotoRemoteRepository implements IProgressPhotoRepository {

  private async generateSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRES);

    if (error || !data?.signedUrl) {
      throw error ? new Error(error.message) : new Error(`Could not generate signed URL for ${storagePath}`);
    }
    return data.signedUrl;
  }

  private async mapRow(row: ProgressPhotoRow): Promise<ProgressPhoto> {
    const signedUrl = await this.generateSignedUrl(row.storage_path);
    return {
      id:          row.id,
      athleteId:   row.athlete_id,
      takenAt:     new Date(row.taken_at),
      tag:         row.tag,
      notes:       row.notes ?? undefined,
      storagePath: row.storage_path,
      signedUrl,
      createdAt:   new Date(row.created_at),
    };
  }

  async getByAthleteId(athleteId: string): Promise<ProgressPhoto[]> {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('taken_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Generate all signed URLs in parallel
    return Promise.all((data ?? []).map((row) => this.mapRow(row as ProgressPhotoRow)));
  }

  async upload(input: CreateProgressPhotoInput, localUri: string): Promise<ProgressPhoto> {
    // 1. Read file as Blob from local URI
    const response    = await fetch(localUri);
    const blob        = await response.blob();
    const ext         = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType    = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storagePath = `${input.athleteId}/${Date.now()}.${ext}`;

    // 2. Upload to private Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: mimeType, upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    // 3. Insert metadata row (no public_url — bucket is private)
    const { data, error: insertError } = await supabase
      .from('progress_photos')
      .insert({
        athlete_id:   input.athleteId,
        taken_at:     input.takenAt.toISOString(),
        tag:          input.tag,
        notes:        input.notes ?? null,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (insertError || !data) throw insertError ?? new Error('No data returned after insert');

    // 4. Return with a fresh signed URL
    return this.mapRow(data as ProgressPhotoRow);
  }

  async delete(photo: ProgressPhoto): Promise<void> {
    // Delete storage file first, then metadata row
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([photo.storagePath]);

    if (storageError) throw new Error(storageError.message);

    const { error: dbError } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photo.id);

    if (dbError) throw new Error(dbError.message);
  }
}
