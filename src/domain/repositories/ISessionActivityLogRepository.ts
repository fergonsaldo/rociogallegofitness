import {
  SessionActivityLog,
  CreateSessionActivityLogInput,
} from '../entities/SessionActivityLog';

export interface ISessionActivityLogRepository {
  getByCoachId(coachId: string, from: Date, to: Date): Promise<SessionActivityLog[]>;
  create(input: CreateSessionActivityLogInput): Promise<void>;
}
