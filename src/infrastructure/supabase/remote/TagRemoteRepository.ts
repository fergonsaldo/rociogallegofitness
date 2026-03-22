import { supabase } from '../client';
import { ClientTag, CreateClientTagInput } from '@/domain/entities/ClientTag';
import { ITagRepository, UpdateClientTagInput } from '@/domain/repositories/ITagRepository';
import { ClientTagRow } from '../database.types';

export class TagRemoteRepository implements ITagRepository {

  private mapRow(row: ClientTagRow, clientCount = 0): ClientTag {
    return {
      id:          row.id,
      coachId:     row.coach_id,
      name:        row.name,
      color:       row.color,
      clientCount,
      createdAt:   new Date(row.created_at),
    };
  }

  async getByCoachId(coachId: string): Promise<ClientTag[]> {
    const { data: tags, error: tagsError } = await supabase
      .from('client_tags')
      .select('*')
      .eq('coach_id', coachId)
      .order('name', { ascending: true });

    if (tagsError) throw tagsError;
    if (!tags || tags.length === 0) return [];

    // Fetch client counts in one query
    const tagIds = tags.map((t: ClientTagRow) => t.id);
    const { data: assignments, error: assignError } = await supabase
      .from('athlete_tags')
      .select('tag_id')
      .in('tag_id', tagIds);

    if (assignError) throw assignError;

    const countMap: Record<string, number> = {};
    for (const row of (assignments ?? [])) {
      countMap[row.tag_id] = (countMap[row.tag_id] ?? 0) + 1;
    }

    return tags.map((t: ClientTagRow) => this.mapRow(t, countMap[t.id] ?? 0));
  }

  async create(input: CreateClientTagInput): Promise<ClientTag> {
    const { data, error } = await supabase
      .from('client_tags')
      .insert({
        coach_id: input.coachId,
        name:     input.name,
        color:    input.color,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error('No data returned after insert');
    return this.mapRow(data as ClientTagRow, 0);
  }

  async update(id: string, input: UpdateClientTagInput): Promise<ClientTag> {
    const patch: Partial<ClientTagRow> = {};
    if (input.name  !== undefined) patch.name  = input.name;
    if (input.color !== undefined) patch.color = input.color;

    const { data, error } = await supabase
      .from('client_tags')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw error ?? new Error('No data returned after update');

    const count = await this.getClientCount(id);
    return this.mapRow(data as ClientTagRow, count);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getClientCount(tagId: string): Promise<number> {
    const { count, error } = await supabase
      .from('athlete_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', tagId);

    if (error) throw error;
    return count ?? 0;
  }
}
