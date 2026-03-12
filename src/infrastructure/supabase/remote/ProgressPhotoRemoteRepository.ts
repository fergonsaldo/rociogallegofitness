import { supabase } from '../client';
import { IProgressPhotoRepository } from '@/domain/repositories/IProgressPhotoRepository';
import { ProgressPhoto, CreateProgressPhotoInput } from '@/domain/entities/ProgressPhoto';
import { ProgressPhotoRow } from '../database.types';

const BUCKET = 'progress-photos';

export class ProgressPhotoRemoteRepository implements IProgressPhotoRepository {

  private mapRow(row: ProgressPhotoRow): ProgressPhoto {
    return {
      id:          row.id,
      athleteId:   row.athlete_id,
      takenAt:     new Date(row.taken_at),
      tag:         row.tag,
      notes:       row.notes ?? undefined,
      storagePath: row.storage_path,
      publicUrl:   row.public_url,
      createdAt:   new Date(row.created_at),
    };
  }

  async getByAthleteId(athleteId: string): Promise<ProgressPhoto[]> {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('taken_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async upload(input: CreateProgressPhotoInput, localUri: string): Promise<ProgressPhoto> {
    // 1. Read the file as a Blob from the local URI
    const response  = await fetch(localUri);
    const blob      = await response.blob();
    const ext       = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType  = ext === 'png' ? 'image/png' : 'image/jpeg';
    const storagePath = `${input.athleteId}/${Date.now()}.${ext}`;

    // 2. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: mimeType, upsert: false });

    if (uploadError) throw uploadError;

    // 3. Get the public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 4. Insert metadata row
    const { data, error: insertError } = await supabase
      .from('progress_photos')
      .insert({
        athlete_id:   input.athleteId,
        taken_at:     input.takenAt.toISOString(),
        tag:          input.tag,
        notes:        input.notes ?? null,
        storage_path: storagePath,
        public_url:   publicUrl,
      })
      .select()
      .single();

    if (insertError || !data) throw insertError ?? new Error('No data returned after insert');
    return this.mapRow(data as ProgressPhotoRow);
  }

  async delete(photo: ProgressPhoto): Promise<void> {
    // Delete storage file first, then metadata row
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([photo.storagePath]);

    if (storageError) throw storageError;

    const { error: dbError } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photo.id);

    if (dbError) throw dbError;
  }
}
