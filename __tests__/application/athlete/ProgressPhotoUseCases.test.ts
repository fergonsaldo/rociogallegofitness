import {
  getProgressPhotosUseCase,
  uploadProgressPhotoUseCase,
  deleteProgressPhotoUseCase,
} from '../../../src/application/athlete/ProgressPhotoUseCases';
import { IProgressPhotoRepository } from '../../../src/domain/repositories/IProgressPhotoRepository';
import { ProgressPhoto, CreateProgressPhotoInput, CreateProgressPhotoSchema } from '../../../src/domain/entities/ProgressPhoto';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ATHLETE_ID = '00000000-0000-4000-a000-000000000001';
const NOW        = new Date();

const PHOTO: ProgressPhoto = {
  id:          '00000000-0000-4000-f000-000000000001',
  athleteId:   ATHLETE_ID,
  takenAt:     NOW,
  tag:         'front',
  storagePath: 'athlete-id/123456.jpg',
  signedUrl:   'https://cdn.example.com/athlete-id/123456.jpg',
  createdAt:   NOW,
};

const VALID_INPUT: CreateProgressPhotoInput = {
  athleteId:   ATHLETE_ID,
  takenAt:     NOW,
  tag:         'front',
  storagePath: 'athlete-id/123456.jpg',
};

const mockRepo: jest.Mocked<IProgressPhotoRepository> = {
  getByAthleteId: jest.fn(),
  upload:         jest.fn(),
  delete:         jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── CreateProgressPhotoSchema ────────────────────────────────────────────────

describe('CreateProgressPhotoSchema — validación', () => {
  it('acepta input válido con tag front', () => {
    expect(() => CreateProgressPhotoSchema.parse(VALID_INPUT)).not.toThrow();
  });

  it('acepta tag back', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, tag: 'back' })).not.toThrow();
  });

  it('acepta tag side', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, tag: 'side' })).not.toThrow();
  });

  it('rechaza tag inválido', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, tag: 'diagonal' })).toThrow();
  });

  it('rechaza storagePath vacío', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, storagePath: '' })).toThrow();
  });

  it('rechaza athleteId que no es UUID', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, athleteId: 'not-a-uuid' })).toThrow();
  });

  it('acepta notas opcionales', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, notes: 'Semana 12' })).not.toThrow();
  });

  it('rechaza notas de más de 300 caracteres', () => {
    expect(() => CreateProgressPhotoSchema.parse({ ...VALID_INPUT, notes: 'a'.repeat(301) })).toThrow();
  });
});

// ── getProgressPhotosUseCase ──────────────────────────────────────────────────

describe('getProgressPhotosUseCase', () => {
  it('devuelve fotos del atleta', async () => {
    mockRepo.getByAthleteId.mockResolvedValue([PHOTO]);
    const result = await getProgressPhotosUseCase(ATHLETE_ID, mockRepo);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe('front');
  });

  it('lanza error si athleteId está vacío', async () => {
    await expect(getProgressPhotosUseCase('', mockRepo)).rejects.toThrow('athleteId is required');
    expect(mockRepo.getByAthleteId).not.toHaveBeenCalled();
  });

  it('devuelve array vacío cuando no hay fotos', async () => {
    mockRepo.getByAthleteId.mockResolvedValue([]);
    expect(await getProgressPhotosUseCase(ATHLETE_ID, mockRepo)).toEqual([]);
  });
});

// ── uploadProgressPhotoUseCase ────────────────────────────────────────────────

describe('uploadProgressPhotoUseCase', () => {
  it('sube una foto con input válido', async () => {
    mockRepo.upload.mockResolvedValue(PHOTO);
    const result = await uploadProgressPhotoUseCase(VALID_INPUT, 'file:///local/photo.jpg', mockRepo);
    expect(result.id).toBe(PHOTO.id);
    expect(mockRepo.upload).toHaveBeenCalledWith(VALID_INPUT, 'file:///local/photo.jpg');
  });

  it('lanza error si localUri está vacío', async () => {
    await expect(uploadProgressPhotoUseCase(VALID_INPUT, '', mockRepo)).rejects.toThrow('localUri is required');
    expect(mockRepo.upload).not.toHaveBeenCalled();
  });

  it('lanza ZodError si el tag es inválido', async () => {
    await expect(uploadProgressPhotoUseCase(
      { ...VALID_INPUT, tag: 'diagonal' as any }, 'file:///local/photo.jpg', mockRepo,
    )).rejects.toThrow();
    expect(mockRepo.upload).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.upload.mockRejectedValue(new Error('Storage error'));
    await expect(uploadProgressPhotoUseCase(VALID_INPUT, 'file:///local.jpg', mockRepo))
      .rejects.toThrow('Storage error');
  });
});

// ── deleteProgressPhotoUseCase ────────────────────────────────────────────────

describe('deleteProgressPhotoUseCase', () => {
  it('elimina una foto', async () => {
    mockRepo.delete.mockResolvedValue(undefined);
    await expect(deleteProgressPhotoUseCase(PHOTO, mockRepo)).resolves.toBeUndefined();
    expect(mockRepo.delete).toHaveBeenCalledWith(PHOTO);
  });

  it('lanza error si photo.id está vacío', async () => {
    await expect(deleteProgressPhotoUseCase({ ...PHOTO, id: '' }, mockRepo)).rejects.toThrow('photo.id is required');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio', async () => {
    mockRepo.delete.mockRejectedValue(new Error('Storage delete failed'));
    await expect(deleteProgressPhotoUseCase(PHOTO, mockRepo)).rejects.toThrow('Storage delete failed');
  });
});
