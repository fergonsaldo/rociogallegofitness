import { BodyMetricRemoteRepository } from '../../../src/infrastructure/supabase/remote/BodyMetricRemoteRepository';
import { CreateBodyMetricInput } from '../../../src/domain/entities/BodyMetric';

// ── Supabase mock ─────────────────────────────────────────────────────────────
// jest.mock se hoistea — la factory NO puede referenciar const externas.
// Solución: factory interna con __mocks expuesto para capturarlo con require().

jest.mock('../../../src/infrastructure/supabase/client', () => {
  const single  = jest.fn();
  const select  = jest.fn();
  const insert  = jest.fn();
  const dbDel   = jest.fn();
  const eq      = jest.fn();
  const order   = jest.fn();

  const chain = { select, insert, delete: dbDel, eq, order, single };

  select.mockReturnValue(chain);
  insert.mockReturnValue(chain);
  dbDel.mockReturnValue(chain);
  eq.mockReturnValue(chain);
  order.mockReturnValue(chain);

  return {
    supabase: { from: jest.fn(() => chain) },
    __mocks: { single, select, insert, dbDel, eq, order, chain },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const clientModule = require('../../../src/infrastructure/supabase/client');
const { supabase } = clientModule;
const m = clientModule.__mocks as {
  single: jest.Mock; select: jest.Mock; insert: jest.Mock; dbDel: jest.Mock;
  eq: jest.Mock; order: jest.Mock; chain: Record<string, jest.Mock>;
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = '00000000-0000-4000-a000-000000000001';
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

beforeEach(() => {
  jest.clearAllMocks();
  // Restaurar encadenamiento y from() tras clearAllMocks
  m.select.mockReturnValue(m.chain);
  m.insert.mockReturnValue(m.chain);
  m.dbDel.mockReturnValue(m.chain);
  m.eq.mockReturnValue(m.chain);
  m.order.mockReturnValue(m.chain);
  supabase.from.mockReturnValue(m.chain);
});

// ── getByAthleteId ────────────────────────────────────────────────────────────

describe('BodyMetricRemoteRepository.getByAthleteId', () => {
  it('devuelve métricas mapeadas correctamente', async () => {
    m.order.mockResolvedValue({ data: [ROW], error: null });
    const result = await repo.getByAthleteId(ATHLETE_ID);
    expect(result).toHaveLength(1);
    expect(result[0].weightKg).toBe(80);
    expect(result[0].recordedAt).toBeInstanceOf(Date);
    expect(result[0].athleteId).toBe(ATHLETE_ID);
  });

  it('devuelve array vacío si no hay filas', async () => {
    m.order.mockResolvedValue({ data: [], error: null });
    expect(await repo.getByAthleteId(ATHLETE_ID)).toEqual([]);
  });

  it('mapea campos nullables a undefined', async () => {
    m.order.mockResolvedValue({
      data: [{ ...ROW, waist_cm: null, hip_cm: null, body_fat_percent: null }],
      error: null,
    });
    const [metric] = await repo.getByAthleteId(ATHLETE_ID);
    expect(metric.waistCm).toBeUndefined();
    expect(metric.hipCm).toBeUndefined();
    expect(metric.bodyFatPercent).toBeUndefined();
  });

  it('lanza error si Supabase falla', async () => {
    m.order.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(repo.getByAthleteId(ATHLETE_ID)).rejects.toThrow('DB error');
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('BodyMetricRemoteRepository.create', () => {
  it('crea una métrica y la devuelve mapeada', async () => {
    m.single.mockResolvedValue({ data: ROW, error: null });
    const result = await repo.create(VALID_INPUT);
    expect(result.id).toBe('metr-0001');
    expect(result.weightKg).toBe(80);
    expect(result.waistCm).toBe(85);
  });

  it('envía null para campos opcionales no presentes', async () => {
    m.single.mockResolvedValue({ data: { ...ROW, waist_cm: null }, error: null });
    const input = { athleteId: ATHLETE_ID, recordedAt: new Date(NOW_ISO), weightKg: 80 };
    await repo.create(input);
    expect(m.insert).toHaveBeenCalledWith(expect.objectContaining({ waist_cm: null }));
  });

  it('lanza error si Supabase devuelve error', async () => {
    m.single.mockResolvedValue({ data: null, error: new Error('Insert failed') });
    await expect(repo.create(VALID_INPUT)).rejects.toThrow('Insert failed');
  });

  it('lanza error si data es null sin error explícito', async () => {
    m.single.mockResolvedValue({ data: null, error: null });
    await expect(repo.create(VALID_INPUT)).rejects.toThrow('No data returned');
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('BodyMetricRemoteRepository.delete', () => {
  it('elimina la fila sin lanzar errores', async () => {
    m.eq.mockResolvedValue({ error: null });
    await expect(repo.delete('metr-0001')).resolves.toBeUndefined();
  });

  it('lanza error si Supabase falla al eliminar', async () => {
    m.eq.mockResolvedValue({ error: new Error('Delete failed') });
    await expect(repo.delete('metr-0001')).rejects.toThrow('Delete failed');
  });
});
