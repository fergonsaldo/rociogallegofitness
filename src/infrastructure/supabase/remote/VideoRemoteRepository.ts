import { supabase } from '../client';
import { IVideoRepository } from '@/domain/repositories/IVideoRepository';
import { Video, CreateVideoInput } from '@/domain/entities/Video';

interface VideoRow {
  id:          string;
  coach_id:    string;
  title:       string;
  url:         string;
  tags:        string[];
  description: string | null;
  created_at:  string;
}

export class VideoRemoteRepository implements IVideoRepository {

  private mapRow(row: VideoRow): Video {
    return {
      id:          row.id,
      coachId:     row.coach_id,
      title:       row.title,
      url:         row.url,
      tags:        row.tags ?? [],
      description: row.description ?? undefined,
      createdAt:   new Date(row.created_at),
    };
  }

  async getAll(coachId: string): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('coach_id', coachId)
      .order('title', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(this.mapRow.bind(this));
  }

  async create(input: CreateVideoInput): Promise<Video> {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        coach_id:    input.coachId,
        title:       input.title,
        url:         input.url,
        tags:        input.tags ?? [],
        description: input.description ?? null,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error('No data returned after insert');
    return this.mapRow(data as VideoRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
