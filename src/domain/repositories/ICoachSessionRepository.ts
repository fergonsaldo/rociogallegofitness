import { CoachSession, CreateCoachSessionInput } from '../entities/CoachSession';

export interface ICoachSessionRepository {
  getForMonth(coachId: string, year: number, month: number): Promise<CoachSession[]>;
  getForRange(coachId: string, from: Date, to: Date): Promise<CoachSession[]>;
  getOverlapping(coachId: string, start: Date, end: Date): Promise<CoachSession[]>;
  create(input: CreateCoachSessionInput): Promise<CoachSession>;
  delete(id: string): Promise<void>;
}
