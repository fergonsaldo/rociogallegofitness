import { AthleteGroup, CreateAthleteGroupInput, UpdateAthleteGroupInput } from '../entities/AthleteGroup';

export interface IAthleteGroupRepository {
  /** Returns all groups for a coach, each with memberCount populated */
  getByCoachId(coachId: string): Promise<AthleteGroup[]>;

  /** Creates a new group */
  create(input: CreateAthleteGroupInput): Promise<AthleteGroup>;

  /** Updates name and/or description */
  update(id: string, input: UpdateAthleteGroupInput): Promise<AthleteGroup>;

  /** Deletes a group (cascades to group_members) */
  delete(id: string): Promise<void>;

  /** Returns the athleteIds of all members in a group */
  getMembers(groupId: string): Promise<string[]>;

  /** Adds an athlete to a group (idempotent) */
  addMember(groupId: string, athleteId: string): Promise<void>;

  /** Removes an athlete from a group */
  removeMember(groupId: string, athleteId: string): Promise<void>;
}
