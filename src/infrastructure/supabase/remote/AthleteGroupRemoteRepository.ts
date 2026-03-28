import { supabase } from '../client';
import { AthleteGroup, CreateAthleteGroupInput, UpdateAthleteGroupInput } from '@/domain/entities/AthleteGroup';
import { IAthleteGroupRepository } from '@/domain/repositories/IAthleteGroupRepository';
import { CoachGroupRow } from '../database.types';

export class AthleteGroupRemoteRepository implements IAthleteGroupRepository {

  private mapRow(row: CoachGroupRow, memberCount = 0): AthleteGroup {
    return {
      id:          row.id,
      coachId:     row.coach_id,
      name:        row.name,
      description: row.description ?? null,
      memberCount,
      createdAt:   new Date(row.created_at),
    };
  }

  async getByCoachId(coachId: string): Promise<AthleteGroup[]> {
    const { data: groups, error: groupsError } = await supabase
      .from('coach_groups')
      .select('*')
      .eq('coach_id', coachId)
      .order('name', { ascending: true });

    if (groupsError) throw new Error(groupsError.message);
    if (!groups || groups.length === 0) return [];

    const groupIds = groups.map((g: CoachGroupRow) => g.id);
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('group_id')
      .in('group_id', groupIds);

    if (membersError) throw new Error(membersError.message);

    const countMap: Record<string, number> = {};
    for (const row of (members ?? [])) {
      countMap[row.group_id] = (countMap[row.group_id] ?? 0) + 1;
    }

    return groups.map((g: CoachGroupRow) => this.mapRow(g, countMap[g.id] ?? 0));
  }

  async create(input: CreateAthleteGroupInput): Promise<AthleteGroup> {
    const { data, error } = await supabase
      .from('coach_groups')
      .insert({
        coach_id:    input.coachId,
        name:        input.name,
        description: input.description ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data)  throw new Error('No data returned after insert');
    return this.mapRow(data as CoachGroupRow, 0);
  }

  async update(id: string, input: UpdateAthleteGroupInput): Promise<AthleteGroup> {
    const patch: Partial<CoachGroupRow> = {};
    if (input.name        !== undefined) patch.name        = input.name;
    if (input.description !== undefined) patch.description = input.description ?? null;

    const { data, error } = await supabase
      .from('coach_groups')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data)  throw new Error('No data returned after update');

    const count = await this.getMemberCount(id);
    return this.mapRow(data as CoachGroupRow, count);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coach_groups')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getMembers(groupId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('athlete_id')
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
    return (data ?? []).map((r: { athlete_id: string }) => r.athlete_id);
  }

  async addMember(groupId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .upsert({ group_id: groupId, athlete_id: athleteId }, { onConflict: 'group_id,athlete_id' });

    if (error) throw new Error(error.message);
  }

  async removeMember(groupId: string, athleteId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('athlete_id', athleteId);

    if (error) throw new Error(error.message);
  }

  private async getMemberCount(groupId: string): Promise<number> {
    const { count, error } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
