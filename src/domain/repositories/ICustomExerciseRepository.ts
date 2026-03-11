import { CustomExercise, CreateCustomExerciseInput } from '../entities/CustomExercise';

export interface ICustomExerciseRepository {
  /** Returns all custom exercises created by the given coach */
  getByCoachId(coachId: string): Promise<CustomExercise[]>;

  /** Creates a new custom exercise and returns it with the generated id */
  create(input: CreateCustomExerciseInput): Promise<CustomExercise>;
}
