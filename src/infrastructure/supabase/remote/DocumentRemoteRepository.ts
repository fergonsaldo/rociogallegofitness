import { supabase } from '../client';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, CreateDocumentInput } from '@/domain/entities/Document';

const BUCKET             = 'documents';
const SIGNED_URL_EXPIRES = 60 * 60; // 1 hour

export class DocumentRemoteRepository implements IDocumentRepository {

  private async generateSignedUrl(filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRES);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  private async mapRow(row: any): Promise<Document> {
    const downloadUrl = await this.generateSignedUrl(row.file_path);
    return {
      id:          row.id,
      coachId:     row.coach_id,
      athleteId:   row.athlete_id,
      name:        row.name,
      filePath:    row.file_path,
      fileSize:    Number(row.file_size),
      mimeType:    row.mime_type,
      uploadedBy:  row.uploaded_by,
      createdAt:   new Date(row.created_at),
      downloadUrl,
    };
  }

  async getDocuments(coachId: string, athleteId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return Promise.all((data ?? []).map((row) => this.mapRow(row)));
  }

  async uploadDocument(input: CreateDocumentInput): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        coach_id:    input.coachId,
        athlete_id:  input.athleteId,
        name:        input.name,
        file_path:   input.filePath,
        file_size:   input.fileSize,
        mime_type:   input.mimeType,
        uploaded_by: input.uploadedBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after document insert');
    return this.mapRow(data);
  }

  async deleteDocument(doc: Document): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([doc.filePath]);
    if (storageError) throw new Error(storageError.message);

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);
    if (dbError) throw new Error(dbError.message);
  }

  async uploadFile(
    coachId: string,
    athleteId: string,
    localUri: string,
    mimeType: string,
  ): Promise<{ filePath: string; fileSize: number }> {
    const response = await fetch(localUri);
    const blob     = await response.blob();
    const ext      = localUri.split('.').pop()?.toLowerCase() ?? 'bin';
    const filePath = `${coachId}/${athleteId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, { contentType: mimeType, upsert: false });

    if (error) throw new Error(error.message);
    return { filePath, fileSize: blob.size };
  }
}
