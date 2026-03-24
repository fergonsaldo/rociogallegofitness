import {
  isBlockedExtension,
  getDocumentsUseCase,
  uploadDocumentUseCase,
  deleteDocumentUseCase,
} from '../../../src/application/coach/DocumentUseCases';
import { IDocumentRepository } from '../../../src/domain/repositories/IDocumentRepository';
import { Document } from '../../../src/domain/entities/Document';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COACH_ID   = '00000000-0000-4000-b000-000000000001';
const ATHLETE_ID = '00000000-0000-4000-b000-000000000002';
const DOC_ID     = 'dddddddd-0000-4000-b000-000000000001';

const makeDoc = (overrides: Partial<Document> = {}): Document => ({
  id:          DOC_ID,
  coachId:     COACH_ID,
  athleteId:   ATHLETE_ID,
  name:        'plan_nutricional.pdf',
  filePath:    `${COACH_ID}/${ATHLETE_ID}/1234567890.pdf`,
  fileSize:    102400,
  mimeType:    'application/pdf',
  uploadedBy:  COACH_ID,
  createdAt:   new Date('2024-01-01'),
  downloadUrl: 'https://example.com/signed-url',
  ...overrides,
});

const mockRepo: jest.Mocked<IDocumentRepository> = {
  getDocuments:   jest.fn(),
  uploadDocument: jest.fn(),
  deleteDocument: jest.fn(),
  uploadFile:     jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── isBlockedExtension ────────────────────────────────────────────────────────

describe('isBlockedExtension', () => {
  it('returns false for allowed extension pdf', () => {
    expect(isBlockedExtension('document.pdf')).toBe(false);
  });

  it('returns false for allowed extension docx', () => {
    expect(isBlockedExtension('report.docx')).toBe(false);
  });

  it('returns false for allowed extension jpg', () => {
    expect(isBlockedExtension('photo.jpg')).toBe(false);
  });

  it('returns false for allowed extension mp4', () => {
    expect(isBlockedExtension('video.mp4')).toBe(false);
  });

  it('returns true for .exe', () => {
    expect(isBlockedExtension('malware.exe')).toBe(true);
  });

  it('returns true for .apk', () => {
    expect(isBlockedExtension('app.apk')).toBe(true);
  });

  it('returns true for .sh', () => {
    expect(isBlockedExtension('script.sh')).toBe(true);
  });

  it('returns true for .bat', () => {
    expect(isBlockedExtension('run.bat')).toBe(true);
  });

  it('returns true for .cmd', () => {
    expect(isBlockedExtension('run.cmd')).toBe(true);
  });

  it('returns true for .ps1', () => {
    expect(isBlockedExtension('script.ps1')).toBe(true);
  });

  it('returns true for .msi', () => {
    expect(isBlockedExtension('installer.msi')).toBe(true);
  });

  it('returns true for .deb', () => {
    expect(isBlockedExtension('package.deb')).toBe(true);
  });

  it('returns true for .dmg', () => {
    expect(isBlockedExtension('app.dmg')).toBe(true);
  });

  it('returns true for .bin', () => {
    expect(isBlockedExtension('firmware.bin')).toBe(true);
  });

  it('is case-insensitive for blocked extensions', () => {
    expect(isBlockedExtension('VIRUS.EXE')).toBe(true);
    expect(isBlockedExtension('Script.SH')).toBe(true);
  });

  it('returns false when filename has no extension', () => {
    expect(isBlockedExtension('README')).toBe(false);
  });

  it('returns false for extension that only partially matches', () => {
    // ".execfile" should not match ".exe"
    expect(isBlockedExtension('run.execfile')).toBe(false);
  });
});

// ── getDocumentsUseCase ───────────────────────────────────────────────────────

describe('getDocumentsUseCase', () => {
  it('returns documents from repo when valid ids provided', async () => {
    const docs = [makeDoc()];
    mockRepo.getDocuments.mockResolvedValue(docs);

    const result = await getDocumentsUseCase(COACH_ID, ATHLETE_ID, mockRepo);

    expect(result).toBe(docs);
    expect(mockRepo.getDocuments).toHaveBeenCalledWith(COACH_ID, ATHLETE_ID);
  });

  it('throws when coachId is empty', async () => {
    await expect(getDocumentsUseCase('', ATHLETE_ID, mockRepo))
      .rejects.toThrow('coachId is required');
    expect(mockRepo.getDocuments).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(getDocumentsUseCase(COACH_ID, '', mockRepo))
      .rejects.toThrow('athleteId is required');
    expect(mockRepo.getDocuments).not.toHaveBeenCalled();
  });

  it('propagates repo errors', async () => {
    mockRepo.getDocuments.mockRejectedValue(new Error('DB error'));

    await expect(getDocumentsUseCase(COACH_ID, ATHLETE_ID, mockRepo))
      .rejects.toThrow('DB error');
  });

  it('returns empty array when repo returns no documents', async () => {
    mockRepo.getDocuments.mockResolvedValue([]);

    const result = await getDocumentsUseCase(COACH_ID, ATHLETE_ID, mockRepo);

    expect(result).toEqual([]);
  });
});

// ── uploadDocumentUseCase ─────────────────────────────────────────────────────

describe('uploadDocumentUseCase', () => {
  const LOCAL_URI = 'file:///tmp/plan.pdf';
  const MIME_TYPE = 'application/pdf';
  const FILE_NAME = 'plan.pdf';
  const FILE_PATH = `${COACH_ID}/${ATHLETE_ID}/1234567890.pdf`;

  beforeEach(() => {
    mockRepo.uploadFile.mockResolvedValue({ filePath: FILE_PATH, fileSize: 102400 });
    mockRepo.uploadDocument.mockResolvedValue(makeDoc());
  });

  it('uploads file and creates document record on success', async () => {
    const result = await uploadDocumentUseCase(
      COACH_ID, ATHLETE_ID, COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo,
    );

    expect(mockRepo.uploadFile).toHaveBeenCalledWith(COACH_ID, ATHLETE_ID, LOCAL_URI, MIME_TYPE);
    expect(mockRepo.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        coachId:    COACH_ID,
        athleteId:  ATHLETE_ID,
        name:       FILE_NAME,
        filePath:   FILE_PATH,
        fileSize:   102400,
        mimeType:   MIME_TYPE,
        uploadedBy: COACH_ID,
      }),
    );
    expect(result).toEqual(makeDoc());
  });

  it('calls uploadFile before uploadDocument', async () => {
    const order: string[] = [];
    mockRepo.uploadFile.mockImplementation(async () => {
      order.push('uploadFile');
      return { filePath: FILE_PATH, fileSize: 102400 };
    });
    mockRepo.uploadDocument.mockImplementation(async () => {
      order.push('uploadDocument');
      return makeDoc();
    });

    await uploadDocumentUseCase(
      COACH_ID, ATHLETE_ID, COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo,
    );

    expect(order).toEqual(['uploadFile', 'uploadDocument']);
  });

  it('throws when coachId is empty', async () => {
    await expect(
      uploadDocumentUseCase('', ATHLETE_ID, COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo),
    ).rejects.toThrow('coachId is required');
    expect(mockRepo.uploadFile).not.toHaveBeenCalled();
  });

  it('throws when athleteId is empty', async () => {
    await expect(
      uploadDocumentUseCase(COACH_ID, '', COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo),
    ).rejects.toThrow('athleteId is required');
    expect(mockRepo.uploadFile).not.toHaveBeenCalled();
  });

  it('throws when file has a blocked extension', async () => {
    await expect(
      uploadDocumentUseCase(
        COACH_ID, ATHLETE_ID, COACH_ID, 'virus.exe', LOCAL_URI, MIME_TYPE, mockRepo,
      ),
    ).rejects.toThrow('no está permitido');
    expect(mockRepo.uploadFile).not.toHaveBeenCalled();
  });

  it('propagates uploadFile errors without calling uploadDocument', async () => {
    mockRepo.uploadFile.mockRejectedValue(new Error('Storage error'));

    await expect(
      uploadDocumentUseCase(
        COACH_ID, ATHLETE_ID, COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo,
      ),
    ).rejects.toThrow('Storage error');
    expect(mockRepo.uploadDocument).not.toHaveBeenCalled();
  });

  it('propagates uploadDocument errors', async () => {
    mockRepo.uploadDocument.mockRejectedValue(new Error('DB insert error'));

    await expect(
      uploadDocumentUseCase(
        COACH_ID, ATHLETE_ID, COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo,
      ),
    ).rejects.toThrow('DB insert error');
  });

  it('rejects files with blocked extension regardless of case', async () => {
    await expect(
      uploadDocumentUseCase(
        COACH_ID, ATHLETE_ID, COACH_ID, 'SETUP.EXE', LOCAL_URI, MIME_TYPE, mockRepo,
      ),
    ).rejects.toThrow('no está permitido');
  });

  it('passes Zod validation with valid input', async () => {
    await expect(
      uploadDocumentUseCase(
        COACH_ID, ATHLETE_ID, COACH_ID, FILE_NAME, LOCAL_URI, MIME_TYPE, mockRepo,
      ),
    ).resolves.toBeDefined();
  });
});

// ── deleteDocumentUseCase ─────────────────────────────────────────────────────

describe('deleteDocumentUseCase', () => {
  it('calls repo.deleteDocument with the document', async () => {
    mockRepo.deleteDocument.mockResolvedValue(undefined);
    const doc = makeDoc();

    await deleteDocumentUseCase(doc, mockRepo);

    expect(mockRepo.deleteDocument).toHaveBeenCalledWith(doc);
  });

  it('throws when document id is empty', async () => {
    const doc = makeDoc({ id: '' });

    await expect(deleteDocumentUseCase(doc, mockRepo))
      .rejects.toThrow('id is required');
    expect(mockRepo.deleteDocument).not.toHaveBeenCalled();
  });

  it('propagates repo errors', async () => {
    mockRepo.deleteDocument.mockRejectedValue(new Error('Delete failed'));

    await expect(deleteDocumentUseCase(makeDoc(), mockRepo))
      .rejects.toThrow('Delete failed');
  });

  it('resolves without value on success', async () => {
    mockRepo.deleteDocument.mockResolvedValue(undefined);

    const result = await deleteDocumentUseCase(makeDoc(), mockRepo);

    expect(result).toBeUndefined();
  });
});
