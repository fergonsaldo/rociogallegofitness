import { SessionType, CreateSessionTypeInput } from '../entities/SessionType';

export type UpdateSessionTypeInput = Partial<Pick<CreateSessionTypeInput, 'name' | 'color'>>;

export interface ISessionTypeRepository {
  getByCoachId(coachId: string): Promise<SessionType[]>;
  create(input: CreateSessionTypeInput): Promise<SessionType>;
  update(id: string, input: UpdateSessionTypeInput): Promise<SessionType>;
  delete(id: string): Promise<void>;
  countUsages(typeId: string): Promise<number>;
  deleteWithSubstitution(id: string, substitutionId?: string): Promise<void>;
}
