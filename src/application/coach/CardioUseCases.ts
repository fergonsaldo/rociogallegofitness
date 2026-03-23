import { ICardioRepository } from '@/domain/repositories/ICardioRepository';
import { CatalogCardio, CreateCardioInput, CreateCardioSchema, CardioType, CardioIntensity } from '@/domain/entities/Cardio';
import { validateUUID } from '@/domain/validation/validateUUID';

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAllCardiosUseCase(
  coachId: string,
  repo: ICardioRepository,
): Promise<CatalogCardio[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getAll(coachId);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createCardioUseCase(
  input: CreateCardioInput,
  repo: ICardioRepository,
): Promise<CatalogCardio> {
  CreateCardioSchema.parse(input);
  return repo.create(input);
}

export async function deleteCardioUseCase(
  id: string,
  repo: ICardioRepository,
): Promise<void> {
  if (!validateUUID(id)) throw new Error('Invalid cardio ID');
  await repo.delete(id);
}

export async function assignCardioToAthleteUseCase(
  cardioId: string,
  athleteId: string,
  repo: ICardioRepository,
): Promise<void> {
  if (!validateUUID(cardioId))  throw new Error('Invalid cardio ID');
  if (!validateUUID(athleteId)) throw new Error('Invalid athlete ID');
  await repo.assignToAthlete(cardioId, athleteId);
}

export async function assignMultipleCardiosUseCase(
  cardioIds: string[],
  athleteId: string,
  repo: ICardioRepository,
): Promise<void> {
  if (cardioIds.length === 0) throw new Error('cardioIds must not be empty');
  if (!validateUUID(athleteId)) throw new Error('Invalid athlete ID');
  for (const id of cardioIds) {
    if (!validateUUID(id)) throw new Error(`Invalid cardio ID: ${id}`);
  }
  await Promise.all(cardioIds.map((id) => repo.assignToAthlete(id, athleteId)));
}

// ── Pure filter (exported for testing) ───────────────────────────────────────

export function filterCardios(
  items: CatalogCardio[],
  query: string,
  types: CardioType[],
  intensities: CardioIntensity[],
): CatalogCardio[] {
  let result = items;

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q),
    );
  }

  if (types.length > 0) {
    result = result.filter((c) => types.includes(c.type));
  }

  if (intensities.length > 0) {
    result = result.filter((c) => intensities.includes(c.intensity));
  }

  return result;
}
