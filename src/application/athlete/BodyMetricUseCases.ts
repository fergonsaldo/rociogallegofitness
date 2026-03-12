import { IBodyMetricRepository } from '@/domain/repositories/IBodyMetricRepository';
import {
  BodyMetric,
  CreateBodyMetricInput,
  CreateBodyMetricSchema,
} from '@/domain/entities/BodyMetric';

export interface BodyMetricSummary {
  latest:  BodyMetric | null;
  initial: BodyMetric | null;
  /** Delta for each field between initial and latest */
  delta: {
    weightKg:       number | null;
    waistCm:        number | null;
    hipCm:          number | null;
    bodyFatPercent: number | null;
  };
}

export async function getBodyMetricsUseCase(
  athleteId: string,
  repo: IBodyMetricRepository,
): Promise<BodyMetric[]> {
  if (!athleteId) throw new Error('athleteId is required');
  return repo.getByAthleteId(athleteId);
}

export async function createBodyMetricUseCase(
  input: CreateBodyMetricInput,
  repo: IBodyMetricRepository,
): Promise<BodyMetric> {
  CreateBodyMetricSchema.parse(input);
  return repo.create(input);
}

export async function deleteBodyMetricUseCase(
  id: string,
  repo: IBodyMetricRepository,
): Promise<void> {
  if (!id) throw new Error('id is required');
  return repo.delete(id);
}

export function buildBodyMetricSummary(metrics: BodyMetric[]): BodyMetricSummary {
  if (metrics.length === 0) {
    return { latest: null, initial: null, delta: { weightKg: null, waistCm: null, hipCm: null, bodyFatPercent: null } };
  }

  const initial = metrics[0];
  const latest  = metrics[metrics.length - 1];

  const diff = (a: number | undefined, b: number | undefined): number | null =>
    a !== undefined && b !== undefined ? Number((b - a).toFixed(2)) : null;

  return {
    latest,
    initial,
    delta: {
      weightKg:       diff(initial.weightKg,       latest.weightKg),
      waistCm:        diff(initial.waistCm,         latest.waistCm),
      hipCm:          diff(initial.hipCm,           latest.hipCm),
      bodyFatPercent: diff(initial.bodyFatPercent,  latest.bodyFatPercent),
    },
  };
}
