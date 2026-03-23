import { ICustomExerciseRepository, UpdateCustomExerciseInput } from '@/domain/repositories/ICustomExerciseRepository';
import {
  CustomExercise,
  CreateCustomExerciseInput,
  CreateCustomExerciseSchema,
} from '@/domain/entities/CustomExercise';
import { Exercise } from '@/domain/entities/Exercise';
import { EXERCISE_CATALOG, MUSCLE_LABELS } from '@/shared/constants/exercises';

// ── Unified catalog type ──────────────────────────────────────────────────────
// coachId: null  → base catalog entry (read-only)
// coachId: uuid  → coach's custom exercise (editable/deletable)

export type CatalogExercise = Exercise & { coachId: string | null };

export async function getCoachCustomExercisesUseCase(
  coachId: string,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise[]> {
  if (!coachId) throw new Error('coachId is required');
  return repo.getByCoachId(coachId);
}

export async function createCustomExerciseUseCase(
  input: CreateCustomExerciseInput,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise> {
  CreateCustomExerciseSchema.parse(input);
  return repo.create(input);
}

export async function updateCustomExerciseUseCase(
  id: string,
  input: UpdateCustomExerciseInput,
  repo: ICustomExerciseRepository,
): Promise<CustomExercise> {
  if (!id) throw new Error('id is required');
  // Validate only the fields being updated using a partial parse
  const partial = CreateCustomExerciseSchema.omit({ coachId: true }).partial();
  partial.parse(input);
  return repo.update(id, input);
}

export async function deleteCustomExerciseUseCase(
  id: string,
  repo: ICustomExerciseRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');

  const inUse = await repo.isInUse(id);
  if (inUse) {
    throw new Error('No se puede eliminar un ejercicio que está en uso en una rutina activa');
  }

  return repo.delete(id);
}

// ── getAllExercisesUseCase ─────────────────────────────────────────────────────

export async function getAllExercisesUseCase(
  coachId: string,
  repo: ICustomExerciseRepository,
): Promise<CatalogExercise[]> {
  if (!coachId) throw new Error('coachId is required');

  const custom = await repo.getByCoachId(coachId);

  const base: CatalogExercise[] = EXERCISE_CATALOG.map((ex) => ({
    ...ex,
    coachId: null,
  }));

  const customMapped: CatalogExercise[] = custom.map((ex) => ({
    id:               ex.id,
    name:             ex.name,
    category:         ex.category,
    primaryMuscles:   ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    isIsometric:      ex.isIsometric,
    description:      ex.description,
    videoUrl:         ex.videoUrl,
    coachId:          ex.coachId,
  }));

  return [...base, ...customMapped].sort((a, b) =>
    a.name.localeCompare(b.name, 'es'),
  );
}

// ── applyExerciseFilters ──────────────────────────────────────────────────────

export function applyExerciseFilters(
  items: CatalogExercise[],
  query: string,
  categories: string[],
  muscles: string[],
): CatalogExercise[] {
  let result = items;

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter((ex) =>
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscles.some((m) => MUSCLE_LABELS[m]?.toLowerCase().includes(q)) ||
      ex.secondaryMuscles.some((m) => MUSCLE_LABELS[m]?.toLowerCase().includes(q)),
    );
  }

  if (categories.length > 0) {
    result = result.filter((ex) => categories.includes(ex.category));
  }

  if (muscles.length > 0) {
    result = result.filter((ex) =>
      muscles.some(
        (m) =>
          (ex.primaryMuscles as string[]).includes(m) ||
          (ex.secondaryMuscles as string[]).includes(m),
      ),
    );
  }

  return result;
}
