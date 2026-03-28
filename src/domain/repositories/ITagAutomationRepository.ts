import { TagAutomation, SaveTagAutomationInput } from '../entities/TagAutomation';

export interface ITagAutomationRepository {
  /** Returns the automation config for a tag, or null if none exists */
  getByTagId(tagId: string): Promise<TagAutomation | null>;

  /** Creates or updates (upsert) the automation config for a tag */
  save(tagId: string, input: SaveTagAutomationInput): Promise<TagAutomation>;

  /** Removes the automation config for a tag */
  delete(tagId: string): Promise<void>;
}
