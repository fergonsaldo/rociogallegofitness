export interface ICoachPreferencesRepository {
  getQuickAccess(coachId: string): Promise<string[] | null>;
  upsertQuickAccess(coachId: string, keys: string[]): Promise<void>;
}
