import { ClientTag, CreateClientTagInput } from '../entities/ClientTag';

export type UpdateClientTagInput = Partial<Pick<CreateClientTagInput, 'name' | 'color'>>;

export interface ITagRepository {
  /** Returns all tags for a coach, each with clientCount populated */
  getByCoachId(coachId: string): Promise<ClientTag[]>;

  /** Creates a new tag and returns it with the generated id */
  create(input: CreateClientTagInput): Promise<ClientTag>;

  /** Updates name and/or color of an existing tag */
  update(id: string, input: UpdateClientTagInput): Promise<ClientTag>;

  /** Deletes a tag (cascades to athlete_tags) */
  delete(id: string): Promise<void>;

  /** Returns how many athletes have this tag assigned */
  getClientCount(tagId: string): Promise<number>;

  /** Returns tags assigned to a single athlete */
  getTagsForAthlete(athleteId: string): Promise<ClientTag[]>;

  /**
   * Returns a map of athleteId → ClientTag[] for a list of athletes.
   * Used for bulk-loading tags in the client list.
   */
  getTagsForAthletes(athleteIds: string[]): Promise<Map<string, ClientTag[]>>;

  /** Assigns a tag to an athlete (idempotent) */
  assignTag(tagId: string, athleteId: string): Promise<void>;

  /** Removes a tag from an athlete */
  removeTag(tagId: string, athleteId: string): Promise<void>;
}
