import { BodyMetric, CreateBodyMetricInput } from '../entities/BodyMetric';

export interface IBodyMetricRepository {
  /** Returns all metrics for an athlete ordered by recordedAt asc */
  getByAthleteId(athleteId: string): Promise<BodyMetric[]>;

  /** Creates a new body metric entry */
  create(input: CreateBodyMetricInput): Promise<BodyMetric>;

  /** Deletes a metric entry by id */
  delete(id: string): Promise<void>;
}
