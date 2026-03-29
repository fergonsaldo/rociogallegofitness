import { supabase } from '../client';
import { SessionType, CreateSessionTypeInput } from '@/domain/entities/SessionType';
import { ISessionTypeRepository, UpdateSessionTypeInput } from '@/domain/repositories/ISessionTypeRepository';
import { SessionTypeRow } from '../database.types';

export class SessionTypeRemoteRepository implements ISessionTypeRepository {

  private mapRow(row: SessionTypeRow): SessionType {
    return {
      id:        row.id,
      coachId:   row.coach_id,
      name:      row.name,
      color:     row.color,
      createdAt: new Date(row.created_at),
    };
  }

  async getByCoachId(coachId: string): Promise<SessionType[]> {
    const { data, error } = await supabase
      .from('session_types')
      .select('*')
      .eq('coach_id', coachId)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row: SessionTypeRow) => this.mapRow(row));
  }

  async create(input: CreateSessionTypeInput): Promise<SessionType> {
    const { data, error } = await supabase
      .from('session_types')
      .insert({
        coach_id: input.coachId,
        name:     input.name,
        color:    input.color,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after insert');
    return this.mapRow(data as SessionTypeRow);
  }

  async update(id: string, input: UpdateSessionTypeInput): Promise<SessionType> {
    const patch: Partial<SessionTypeRow> = {};
    if (input.name  !== undefined) patch.name  = input.name;
    if (input.color !== undefined) patch.color = input.color;

    const { data, error } = await supabase
      .from('session_types')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No data returned after update');
    return this.mapRow(data as SessionTypeRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('session_types')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async countUsages(typeId: string): Promise<number> {
    const { count, error } = await supabase
      .from('coach_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_type_id', typeId);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async deleteWithSubstitution(id: string, substitutionId?: string): Promise<void> {
    if (substitutionId) {
      const { error: updateError } = await supabase
        .from('coach_sessions')
        .update({ session_type_id: substitutionId })
        .eq('session_type_id', id);

      if (updateError) throw new Error(updateError.message);
    }

    const { error: deleteError } = await supabase
      .from('session_types')
      .delete()
      .eq('id', id);

    if (deleteError) throw new Error(deleteError.message);
  }
}
