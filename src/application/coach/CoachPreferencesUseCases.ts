/**
 * Use cases for coach quick-access preferences (RF-E1-02).
 */

import { ICoachPreferencesRepository } from '@/domain/repositories/ICoachPreferencesRepository';
import {
  DEFAULT_QUICK_ACCESS,
  getActiveShortcuts,
  QuickAccessItem,
} from '@/shared/constants/quickAccessCatalog';

export async function getQuickAccessUseCase(
  coachId: string,
  repo: ICoachPreferencesRepository,
): Promise<string[]> {
  if (!coachId) throw new Error('coachId is required');
  const stored = await repo.getQuickAccess(coachId);
  return stored ?? DEFAULT_QUICK_ACCESS;
}

export async function saveQuickAccessUseCase(
  coachId: string,
  keys: string[],
  repo: ICoachPreferencesRepository,
): Promise<void> {
  if (!coachId) throw new Error('coachId is required');
  if (keys.length === 0) throw new Error('At least one shortcut must be selected');
  return repo.upsertQuickAccess(coachId, keys);
}

// Re-export pure function so UI can import from one place
export { getActiveShortcuts, DEFAULT_QUICK_ACCESS };
export type { QuickAccessItem };
