import {
  getBodyMetricsUseCase,
  createBodyMetricUseCase,
  deleteBodyMetricUseCase,
  buildBodyMetricSummary,
} from '../../../src/application/athlete/BodyMetricUseCases';
import { IBodyMetricRepository } from '../../../src/domain/repositories/IBodyMetricRepository';
import { BodyMetric, CreateBodyMetricInput } from '../../../src/domain/entities/BodyMetric';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = 'ath-uuid-0001-0000-000000000001';
const NOW        = new Date('2025-01-15T10:00:00Z');
const LATER      = new Date('2025-03-01T10:00:00Z');

const makeMetric = (overrides: Partial<BodyMetric> = {}): BodyMetric => ({
  id:        'metr-uuid-001',
  athleteId: ATHLETE_ID,
  recordedAt: NOW,
  weightKg:   80,
  waistCm:    85,
  hipCm:      95,
  bodyFatPercent: 18,
  createdAt:  NOW,
  ...overrides,
});

const VALID_INPUT: CreateBodyMetricInput = {
  athleteId:  ATHLETE_ID,
  recordedAt: NOW,
  weightKg:   80,
};

const mockRepo: jest.Mocked<IBodyMetricRepository> = {
  getByAthleteId: jest.fn(),
  create:         jest.fn(),
  delete:         jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── getBodyMetricsUseCase ─────────────────────────────────────────────────────

describe('getBodyMetricsUseCase', () => {
  it('devuelve las métricas del atleta', async () => {
    const metric = makeMetric();
    mockRepo.getByAthleteId.mockResolvedValue([metric]);
    const result = await getBodyMetricsUseCase(ATHLETE_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].weightKg).toBe(80);
  });

  it('lanza error si athleteId está vacío', async () => {
    await expect(getBodyMetricsUseCase('', mockRepo)).rejects.toThrow('athleteId is required');
    expect(mockRepo.getByAthleteId).not.toHaveBeenCalled();
  });

  it('devuelve array vacío cuando no hay registros', async () => {
    mockRepo.getByAthleteId.mockResolvedValue([]);
    expect(await getBodyMetricsUseCase(ATHLETE_ID, mockRepo)).toEqual([]);
  });
});

// ── createBodyMetricUseCase ───────────────────────────────────────────────────

describe('createBodyMetricUseCase', () => {
  it('crea una métrica con input válido', async () => {
    const metric = makeMetric();
    mockRepo.create.mockResolvedValue(metric);
    const result = await createBodyMetricUseCase(VALID_INPUT, mockRepo);
    expect(result.weightKg).toBe(80);
    expect(mockRepo.create).toHaveBeenCalledWith(VALID_INPUT);
  });

  it('lanza ZodError si no se proporciona ninguna métrica', async () => {
    const input = { athleteId: ATHLETE_ID, recordedAt: NOW };
    await expect(createBodyMetricUseCase(input as any, mockRepo)).rejects.toThrow();
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('acepta métrica solo con % grasa', async () => {
    mockRepo.create.mockResolvedValue(makeMetric({ weightKg: undefined, bodyFatPercent: 20 }));
    await expect(createBodyMetricUseCase({ athleteId: ATHLETE_ID, recordedAt: NOW, bodyFatPercent: 20 }, mockRepo))
      .resolves.toBeDefined();
  });

  it('lanza ZodError si el peso es negativo', async () => {
    await expect(createBodyMetricUseCase({ ...VALID_INPUT, weightKg: -5 }, mockRepo)).rejects.toThrow();
  });

  it('lanza ZodError si % grasa supera 70', async () => {
    await expect(createBodyMetricUseCase({ ...VALID_INPUT, bodyFatPercent: 71 }, mockRepo)).rejects.toThrow();
  });
});

// ── deleteBodyMetricUseCase ───────────────────────────────────────────────────

describe('deleteBodyMetricUseCase', () => {
  it('elimina una métrica por id', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await expect(deleteBodyMetricUseCase('metr-uuid-001', mockRepo)).resolves.toBeUndefined();
    expect(mockRepo.delete).toHaveBeenCalledWith('metr-uuid-001');
  });

  it('lanza error si id está vacío', async () => {
    await expect(deleteBodyMetricUseCase('', mockRepo)).rejects.toThrow('id is required');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});

// ── buildBodyMetricSummary ────────────────────────────────────────────────────

describe('buildBodyMetricSummary', () => {
  it('devuelve summary vacío con array vacío', () => {
    const result = buildBodyMetricSummary([]);
    expect(result.latest).toBeNull();
    expect(result.initial).toBeNull();
    expect(result.delta.weightKg).toBeNull();
  });

  it('con un solo registro, initial y latest son el mismo', () => {
    const metric = makeMetric();
    const result = buildBodyMetricSummary([metric]);
    expect(result.initial?.id).toBe(result.latest?.id);
  });

  it('calcula correctamente el delta de pérdida de peso', () => {
    const initial = makeMetric({ id: 'a', recordedAt: NOW,   weightKg: 85 });
    const latest  = makeMetric({ id: 'b', recordedAt: LATER, weightKg: 80 });
    const result  = buildBodyMetricSummary([initial, latest]);
    expect(result.delta.weightKg).toBe(-5);
  });

  it('calcula correctamente el delta de ganancia de peso', () => {
    const initial = makeMetric({ id: 'a', weightKg: 70 });
    const latest  = makeMetric({ id: 'b', weightKg: 75 });
    const result  = buildBodyMetricSummary([initial, latest]);
    expect(result.delta.weightKg).toBe(5);
  });

  it('devuelve null en delta para campos sin datos en alguno de los extremos', () => {
    const initial = makeMetric({ id: 'a', waistCm: undefined });
    const latest  = makeMetric({ id: 'b', waistCm: 80 });
    const result  = buildBodyMetricSummary([initial, latest]);
    expect(result.delta.waistCm).toBeNull();
  });

  it('usa el primer registro como inicial y el último como actual', () => {
    const m1 = makeMetric({ id: 'a', recordedAt: NOW,   weightKg: 90 });
    const m2 = makeMetric({ id: 'b', recordedAt: LATER, weightKg: 85 });
    const result = buildBodyMetricSummary([m1, m2]);
    expect(result.initial?.id).toBe('a');
    expect(result.latest?.id).toBe('b');
  });

  it('redondea el delta a 2 decimales', () => {
    const initial = makeMetric({ id: 'a', weightKg: 80.333 });
    const latest  = makeMetric({ id: 'b', weightKg: 79.111 });
    const result  = buildBodyMetricSummary([initial, latest]);
    expect(result.delta.weightKg?.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});
