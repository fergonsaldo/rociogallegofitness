import { CustomExercise, CreateCustomExerciseInput } from '../entities/CustomExercise';

export type UpdateCustomExerciseInput = Partial<Omit<CreateCustomExerciseInput, 'coachId'>>;

export interface ICustomExerciseRepository {
  /** Returns all custom exercises created by the given coach */
  getByCoachId(coachId: string): Promise<CustomExercise[]>;

  /** Creates a new custom exercise and returns it with the generated id */
  create(input: CreateCustomExerciseInput): Promise<CustomExercise>;

  /** Updates mutable fields of an existing custom exercise */
  update(id: string, input: UpdateCustomExerciseInput): Promise<CustomExercise>;

  /** Deletes a custom exercise by id */
  delete(id: string): Promise<void>;

  /** Returns true if the exercise is referenced in at least one routine */
  isInUse(exerciseId: string): Promise<boolean>;
}
