import { Schedule, CreateScheduleInput } from '../entities/Schedule';

export interface IScheduleRepository {
  getByCoachId(coachId: string): Promise<Schedule[]>;
  create(input: CreateScheduleInput): Promise<Schedule>;
  toggleActive(id: string, isActive: boolean): Promise<Schedule>;
  delete(id: string): Promise<void>;
}
