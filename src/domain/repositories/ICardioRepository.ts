import { Cardio, CatalogCardio, CreateCardioInput } from '../entities/Cardio';

export interface ICardioRepository {
  /** Returns base catalog (coach_id NULL) + coach's own cardios, sorted alphabetically */
  getAll(coachId: string): Promise<CatalogCardio[]>;

  /** Creates a new coach-owned cardio */
  create(input: CreateCardioInput): Promise<Cardio>;

  /** Deletes a coach-owned cardio */
  delete(id: string): Promise<void>;

  /** Assigns a cardio to an athlete */
  assignToAthlete(cardioId: string, athleteId: string): Promise<void>;

  /** Removes a cardio assignment from an athlete */
  unassignFromAthlete(cardioId: string, athleteId: string): Promise<void>;
}
