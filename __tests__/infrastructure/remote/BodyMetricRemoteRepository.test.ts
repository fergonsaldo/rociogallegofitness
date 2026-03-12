import { BodyMetricRemoteRepository } from '../../../src/infrastructure/supabase/remote/BodyMetricRemoteRepository';
import { CreateBodyMetricInput } from '../../../src/domain/entities/BodyMetric';

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockSingle  = jest.fn();
const mockSelect  = jest.fn();
const mockInsert  = jest.fn();
const mockDelete  = jest.fn();
const mockEq      = jest.fn();
const mockOrder   = jest.fn();

jest.mock('../../../src/infrastructure/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      delete: mockDelete.mockReturnThis(),
      eq:     mockEq.mockReturnThis(),
      order:  mockOrder.mockReturnThis(),
      single: mockSingle,
    })),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = 'ath-uuid-0001-0000-000000000001';
const NOW_ISO    = '2025-01-15T10:00:00.000Z';

const ROW = {
  id:               'metr-0001',
  athlete_id:       ATHLETE_ID,
  recorded_at:      NOW_ISO,
  weight_kg:        80,
  waist_cm:         85,
  hip_cm:           95,
  body_fat_percent: 18,
  notes:            null,
  created_at:       NOW_ISO,
};

const VALID_INPUT: CreateBodyMetricInput = {
  athleteId:  ATHLETE_ID,
  recordedAt: new Date(NOW_ISO),
  weightKg:   80,
  waistCm:    85,
};

const repo = new BodyMetricRemoteRepository();

beforeEach(() => jest.clearAllMocks());

// ── getByAthleteId ────────────────────────────────────────────────────────────

describe('BodyMetricRemoteRepository.getByAthleteId', () => {
  it('devuelve métricas mapeadas correctamente', async () => {
    mockOrder.mockResolvedValue({ data: [ROW], error: null });
    const result = await repo.getByAthleteId(ATHLETE_ID);
    expect(result).toHaveLength(1);
    expect(result[0].weightKg).toBe(80);
    expect(result[0].recordedAt).toBeInstanceOf(Date);
    expect(result[0].athleteId).toBe(ATHLETE_ID);
  });

  it('devuelve array vacío si no hay filas', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    expect(await repo.getByAthleteId(ATHLETE_ID)).toEqual([]);
  });

  it('mapea campos nullables a undefined', async () => {
    mockOrder.mockResolvedValue({ data: [{ ...ROW, waist_cm: null, hip_cm: null, body_fat_percent: null }], error: null });
    const [m] = await repo.getByAthleteId(ATHLETE_ID);
    expect(m.waistCm).toBeUndefined();
    expect(m.hipCm).toBeUndefined();
    expect(m.bodyFatPercent).toBeUndefined();
  });

  it('lanza error si Supabase falla', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(repo.getByAthleteId(ATHLETE_ID)).rejects.toThrow('DB error');
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('BodyMetricRemoteRepository.create', () => {
  it('crea una métrica y la devuelve mapeada', async () => {
    mockSingle.mockResolvedValue({ data: ROW, error: null });
    const result = await repo.create(VALID_INPUT);
    expect(result.id).toBe('metr-0001');
    expect(result.weightKg).toBe(80);
    expect(result.waistCm).toBe(85);
  });

  it('envía null para campos opcionales no presentes', async () => {
    mockSingle.mockResolvedValue({ data: { ...ROW, waist_cm: null }, error: null });
    const input = { athleteId: ATHLETE_ID, recordedAt: new Date(NOW_ISO), weightKg: 80 };
    await repo.create(input);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ waist_cm: null }));
  });

  it('lanza error si Supabase devuelve error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('Insert failed') });
    await expect(repo.create(VALID_INPUT)).rejects.toThrow('Insert failed');
  });

  it('lanza error si data es null sin error explícito', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    await expect(repo.create(VALID_INPUT)).rejects.toThrow('No data returned');
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('BodyMetricRemoteRepository.delete', () => {
  it('elimina la fila sin lanzar errores', async () => {
    mockEq.mockResolvedValue({ error: null });
    await expect(repo.delete('metr-0001')).resolves.toBeUndefined();
  });

  it('lanza error si Supabase falla al eliminar', async () => {
    mockEq.mockResolvedValue({ error: new Error('Delete failed') });
    await expect(repo.delete('metr-0001')).rejects.toThrow('Delete failed');
  });
});
