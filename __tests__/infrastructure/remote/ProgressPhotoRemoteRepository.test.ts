import { ProgressPhotoRemoteRepository } from '../../../src/infrastructure/supabase/remote/ProgressPhotoRemoteRepository';
import { CreateProgressPhotoInput, ProgressPhoto } from '../../../src/domain/entities/ProgressPhoto';

// ── Supabase mock ─────────────────────────────────────────────────────────────

const mockSingle      = jest.fn();
const mockSelect      = jest.fn();
const mockInsert      = jest.fn();
const mockDbDelete    = jest.fn();
const mockEq          = jest.fn();
const mockOrder       = jest.fn();
const mockUpload      = jest.fn();
const mockRemove      = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('../../../src/infrastructure/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect.mockReturnThis(),
      insert: mockInsert.mockReturnThis(),
      delete: mockDbDelete.mockReturnThis(),
      eq:     mockEq.mockReturnThis(),
      order:  mockOrder.mockReturnThis(),
      single: mockSingle,
    })),
    storage: {
      from: jest.fn(() => ({
        upload:       mockUpload,
        remove:       mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}));

// Fetch mock for reading local file
global.fetch = jest.fn().mockResolvedValue({
  blob: jest.fn().mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
} as any);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID   = 'ath-uuid-0001-0000-000000000001';
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
  public_url:   PUBLIC_URL,
  created_at:   NOW_ISO,
};

const PHOTO: ProgressPhoto = {
  id:          'photo-0001',
  athleteId:   ATHLETE_ID,
  takenAt:     new Date(NOW_ISO),
  tag:         'front',
  storagePath: STORAGE_PATH,
  publicUrl:   PUBLIC_URL,
  createdAt:   new Date(NOW_ISO),
};

const UPLOAD_INPUT: CreateProgressPhotoInput = {
  athleteId:   ATHLETE_ID,
  takenAt:     new Date(NOW_ISO),
  tag:         'front',
  storagePath: '',
};

const repo = new ProgressPhotoRemoteRepository();

beforeEach(() => jest.clearAllMocks());

// ── getByAthleteId ────────────────────────────────────────────────────────────

describe('ProgressPhotoRemoteRepository.getByAthleteId', () => {
  it('devuelve fotos mapeadas correctamente', async () => {
    mockOrder.mockResolvedValue({ data: [ROW], error: null });
    const result = await repo.getByAthleteId(ATHLETE_ID);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe('front');
    expect(result[0].publicUrl).toBe(PUBLIC_URL);
    expect(result[0].takenAt).toBeInstanceOf(Date);
  });

  it('mapea notes null a undefined', async () => {
    mockOrder.mockResolvedValue({ data: [{ ...ROW, notes: null }], error: null });
    const [p] = await repo.getByAthleteId(ATHLETE_ID);
    expect(p.notes).toBeUndefined();
  });

  it('devuelve array vacío si no hay filas', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    expect(await repo.getByAthleteId(ATHLETE_ID)).toEqual([]);
  });

  it('lanza error si Supabase falla', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(repo.getByAthleteId(ATHLETE_ID)).rejects.toThrow('DB error');
  });
});

// ── upload ────────────────────────────────────────────────────────────────────

describe('ProgressPhotoRemoteRepository.upload', () => {
  beforeEach(() => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: PUBLIC_URL } });
    mockSingle.mockResolvedValue({ data: ROW, error: null });
  });

  it('sube la imagen y devuelve la foto mapeada', async () => {
    const result = await repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg');
    expect(result.id).toBe('photo-0001');
    expect(result.publicUrl).toBe(PUBLIC_URL);
  });

  it('llama a Storage.upload antes de insertar en DB', async () => {
    await repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg');
    expect(mockUpload).toHaveBeenCalled();
    expect(mockSingle).toHaveBeenCalled();
  });

  it('lanza error si falla la subida al Storage', async () => {
    mockUpload.mockResolvedValue({ error: new Error('Upload failed') });
    await expect(repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg')).rejects.toThrow('Upload failed');
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it('lanza error si falla el insert en DB', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('DB insert error') });
    await expect(repo.upload(UPLOAD_INPUT, 'file:///local/photo.jpg')).rejects.toThrow('DB insert error');
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('ProgressPhotoRemoteRepository.delete', () => {
  it('elimina el fichero de Storage y la fila de DB', async () => {
    mockRemove.mockResolvedValue({ error: null });
    mockEq.mockResolvedValue({ error: null });
    await expect(repo.delete(PHOTO)).resolves.toBeUndefined();
    expect(mockRemove).toHaveBeenCalledWith([STORAGE_PATH]);
    expect(mockEq).toHaveBeenCalled();
  });

  it('lanza error si falla la eliminación del Storage', async () => {
    mockRemove.mockResolvedValue({ error: new Error('Storage remove failed') });
    await expect(repo.delete(PHOTO)).rejects.toThrow('Storage remove failed');
    expect(mockEq).not.toHaveBeenCalled();
  });

  it('lanza error si falla el delete en DB', async () => {
    mockRemove.mockResolvedValue({ error: null });
    mockEq.mockResolvedValue({ error: new Error('DB delete error') });
    await expect(repo.delete(PHOTO)).rejects.toThrow('DB delete error');
  });
});
