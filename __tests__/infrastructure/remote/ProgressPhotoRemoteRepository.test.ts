import { ProgressPhotoRemoteRepository } from '../../../src/infrastructure/supabase/remote/ProgressPhotoRemoteRepository';
import { CreateProgressPhotoInput, ProgressPhoto } from '../../../src/domain/entities/ProgressPhoto';

// ── Supabase mock ─────────────────────────────────────────────────────────────
// jest.mock se hoistea al inicio del fichero — la factory NO puede referenciar
// variables `const` declaradas fuera (temporal dead zone).
// Solución: la factory crea sus propios jest.fn() internos; los capturamos
// después con require() para poder configurarlos en cada test.

jest.mock('../../../src/infrastructure/supabase/client', () => {
  const single          = jest.fn();
  const select          = jest.fn();
  const insert          = jest.fn();
  const dbDelete        = jest.fn();
  const eq              = jest.fn();
  const order           = jest.fn();
  const upload          = jest.fn();
  const remove          = jest.fn();
  const createSignedUrl = jest.fn();

  const dbChain = { select, insert, delete: dbDelete, eq, order, single };

  select.mockReturnValue(dbChain);
  insert.mockReturnValue(dbChain);
  dbDelete.mockReturnValue(dbChain);
  eq.mockReturnValue(dbChain);
  order.mockReturnValue(dbChain);

  const storageChain = { upload, remove, createSignedUrl };

  return {
    supabase: {
      from:    jest.fn(() => dbChain),
      storage: { from: jest.fn(() => storageChain) },
    },
    // Expose internals so tests can configure them
    __mocks: { single, select, insert, dbDelete, eq, order, upload, remove, createSignedUrl, dbChain, storageChain },
  };
});

global.fetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
} as any);

// ── Capture mock references ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const clientModule = require('../../../src/infrastructure/supabase/client');
const { supabase } = clientModule;
const m = clientModule.__mocks as {
  single: jest.Mock; select: jest.Mock; insert: jest.Mock; dbDelete: jest.Mock;
  eq: jest.Mock; order: jest.Mock; upload: jest.Mock; remove: jest.Mock;
  createSignedUrl: jest.Mock; dbChain: Record<string, jest.Mock>;
  storageChain: Record<string, jest.Mock>;
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID   = '00000000-0000-4000-a000-000000000001';
const NOW_ISO      = '2025-01-15T10:00:00.000Z';
const PUBLIC_URL   = 'https://cdn.example.com/athlete-id/123.jpg';
const STORAGE_PATH = `${ATHLETE_ID}/123.jpg`;

const ROW = {
  id:           'photo-0001',
  athlete_id:   ATHLETE_ID,
  taken_at:     NOW_ISO,
  tag:          'front' as const,
  notes:        null,
  storage_path: STORAGE_PATH,
  created_at:   NOW_ISO,
};

const PHOTO: ProgressPhoto = {
  id:          'photo-0001',
  athleteId:   ATHLETE_ID,
  takenAt:     new Date(NOW_ISO),
  tag:         'front',
  storagePath: STORAGE_PATH,
  signedUrl:   PUBLIC_URL,
  createdAt:   new Date(NOW_ISO),
};

const UPLOAD_INPUT: CreateProgressPhotoInput = {
  athleteId:   ATHLETE_ID,
  takenAt:     new Date(NOW_ISO),
  tag:         'front',
  storagePath: '',
};

const repo = new ProgressPhotoRemoteRepository();

beforeEach(() => {
  jest.clearAllMocks();
  // Restaurar encadenamiento tras clearAllMocks
  m.select.mockReturnValue(m.dbChain);
  m.insert.mockReturnValue(m.dbChain);
  m.dbDelete.mockReturnValue(m.dbChain);
  m.eq.mockReturnValue(m.dbChain);
  m.order.mockReturnValue(m.dbChain);
  supabase.from.mockReturnValue(m.dbChain);
  supabase.storage.from.mockReturnValue(m.storageChain);
});

// ── getByAthleteId ────────────────────────────────────────────────────────────

describe('ProgressPhotoRemoteRepository.getByAthleteId', () => {
  it('devuelve fotos mapeadas correctamente', async () => {
    m.order.mockResolvedValue({ data: [ROW], error: null });
    m.createSignedUrl.mockResolvedValue({ data: { signedUrl: PUBLIC_URL }, error: null });
    const result = await repo.getByAthleteId(ATHLETE_ID);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe('front');
    expect(result[0].signedUrl).toBe(PUBLIC_URL);
    expect(result[0].takenAt).toBeInstanceOf(Date);
  });

  it('mapea notes null a undefined', async () => {
    m.order.mockResolvedValue({ data: [{ ...ROW, notes: null }], error: null });
    m.createSignedUrl.mockResolvedValue({ data: { signedUrl: PUBLIC_URL }, error: null });
    const [p] = await repo.getByAthleteId(ATHLETE_ID);
    expect(p.notes).toBeUndefined();
  });

  it('devuelve array vacío si no hay filas', async () => {
    m.order.mockResolvedValue({ data: [], error: null });
    expect(await repo.getByAthleteId(ATHLETE_ID)).toEqual([]);
  });

  it('lanza error si Supabase falla', async () => {
    m.order.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(repo.getByAthleteId(ATHLETE_ID)).rejects.toThrow('DB error');
  });

  it('lanza error si createSignedUrl falla', async () => {
    m.order.mockResolvedValue({ data: [ROW], error: null });
    m.createSignedUrl.mockResolvedValue({ data: null, error: new Error('Signed URL error') });
    await expect(repo.getByAthleteId(ATHLETE_ID)).rejects.toThrow('Signed URL error');
  });
});

// ── upload ────────────────────────────────────────────────────────────────────

describe('ProgressPhotoRemoteRepository.upload', () => {
  beforeEach(() => {
    m.upload.mockResolvedValue({ error: null });
    m.createSignedUrl.mockResolvedValue({ data: { signedUrl: PUBLIC_URL }, error: null });
    m.single.mockResolvedValue({ data: ROW, error: null });
  });

  it('sube la imagen y devuelve la foto mapeada', async () => {
    const result = await repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg');
    expect(result.id).toBe('photo-0001');
    expect(result.signedUrl).toBe(PUBLIC_URL);
  });

  it('llama a Storage.upload antes de insertar en DB', async () => {
    await repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg');
    expect(m.upload).toHaveBeenCalled();
    expect(m.single).toHaveBeenCalled();
  });

  it('lanza error si falla la subida al Storage', async () => {
    m.upload.mockResolvedValue({ error: new Error('Upload failed') });
    await expect(repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg')).rejects.toThrow('Upload failed');
    expect(m.single).not.toHaveBeenCalled();
  });

  it('lanza error si falla el insert en DB', async () => {
    m.single.mockResolvedValue({ data: null, error: new Error('DB insert error') });
    await expect(repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg')).rejects.toThrow('DB insert error');
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('ProgressPhotoRemoteRepository.delete', () => {
  it('elimina el fichero de Storage y la fila de DB', async () => {
    m.remove.mockResolvedValue({ error: null });
    m.eq.mockResolvedValue({ error: null });
    await expect(repo.delete(PHOTO)).resolves.toBeUndefined();
    expect(m.remove).toHaveBeenCalledWith([STORAGE_PATH]);
    expect(m.eq).toHaveBeenCalled();
  });

  it('lanza error si falla la eliminación del Storage', async () => {
    m.remove.mockResolvedValue({ error: new Error('Storage remove failed') });
    await expect(repo.delete(PHOTO)).rejects.toThrow('Storage remove failed');
    expect(m.eq).not.toHaveBeenCalled();
  });

  it('lanza error si falla el delete en DB', async () => {
    m.remove.mockResolvedValue({ error: null });
    m.eq.mockResolvedValue({ error: new Error('DB delete error') });
    await expect(repo.delete(PHOTO)).rejects.toThrow('DB delete error');
  });
});
