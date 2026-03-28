/**
 * Document entity schema tests — RF-E7-02
 */

import {
  DocumentSchema,
  CreateDocumentSchema,
  BLOCKED_EXTENSIONS,
} from '../../../src/domain/entities/Document';

const UUID  = '00000000-0000-4000-b000-000000000001';
const UUID2 = '00000000-0000-4000-b000-000000000002';
const NOW   = new Date();

const VALID_DOC = {
  id:          UUID,
  coachId:     UUID,
  athleteId:   UUID2,
  name:        'plan.pdf',
  filePath:    `${UUID}/${UUID2}/1234.pdf`,
  fileSize:    102400,
  mimeType:    'application/pdf',
  uploadedBy:  UUID,
  createdAt:   NOW,
  downloadUrl: 'https://example.com/file',
};

const VALID_CREATE = {
  coachId:    UUID,
  athleteId:  UUID2,
  name:       'plan.pdf',
  filePath:   `${UUID}/${UUID2}/1234.pdf`,
  fileSize:   102400,
  mimeType:   'application/pdf',
  uploadedBy: UUID,
};

// ── DocumentSchema ────────────────────────────────────────────────────────────

describe('DocumentSchema', () => {
  it('parses a valid document', () => {
    expect(() => DocumentSchema.parse(VALID_DOC)).not.toThrow();
  });

  it('accepts null downloadUrl', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, downloadUrl: null })).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, name: '' })).toThrow();
  });

  it('rejects name longer than 200 characters', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, name: 'a'.repeat(201) })).toThrow();
  });

  it('accepts name of exactly 200 characters', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, name: 'a'.repeat(200) })).not.toThrow();
  });

  it('rejects empty filePath', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, filePath: '' })).toThrow();
  });

  it('rejects empty mimeType', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, mimeType: '' })).toThrow();
  });

  it('rejects invalid UUID for coachId', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, coachId: 'not-a-uuid' })).toThrow();
  });

  it('rejects non-positive fileSize', () => {
    expect(() => DocumentSchema.parse({ ...VALID_DOC, fileSize: 0 })).toThrow();
    expect(() => DocumentSchema.parse({ ...VALID_DOC, fileSize: -1 })).toThrow();
  });
});

// ── CreateDocumentSchema ──────────────────────────────────────────────────────

describe('CreateDocumentSchema', () => {
  it('parses a valid create input', () => {
    expect(() => CreateDocumentSchema.parse(VALID_CREATE)).not.toThrow();
  });

  it('rejects invalid coachId and includes Coach ID inválido message', () => {
    const { error } = CreateDocumentSchema.safeParse({ ...VALID_CREATE, coachId: 'bad' });
    expect(error).toBeDefined();
    expect(JSON.stringify(error!.issues)).toContain('Coach ID inválido');
  });

  it('rejects invalid athleteId and includes Athlete ID inválido message', () => {
    const { error } = CreateDocumentSchema.safeParse({ ...VALID_CREATE, athleteId: 'bad' });
    expect(error).toBeDefined();
    expect(JSON.stringify(error!.issues)).toContain('Athlete ID inválido');
  });

  it('rejects empty name and includes El nombre es obligatorio message', () => {
    const { error } = CreateDocumentSchema.safeParse({ ...VALID_CREATE, name: '' });
    expect(error).toBeDefined();
    expect(JSON.stringify(error!.issues)).toContain('El nombre es obligatorio');
  });

  it('rejects name longer than 200 characters', () => {
    expect(() => CreateDocumentSchema.parse({ ...VALID_CREATE, name: 'x'.repeat(201) })).toThrow();
  });

  it('accepts name of exactly 1 character', () => {
    expect(() => CreateDocumentSchema.parse({ ...VALID_CREATE, name: 'x' })).not.toThrow();
  });
});

// ── BLOCKED_EXTENSIONS ────────────────────────────────────────────────────────

describe('BLOCKED_EXTENSIONS', () => {
  it('includes all expected dangerous extensions', () => {
    const expected = ['.exe', '.apk', '.sh', '.bat', '.cmd', '.ps1', '.msi', '.deb', '.dmg', '.bin'];
    for (const ext of expected) {
      expect(BLOCKED_EXTENSIONS).toContain(ext);
    }
  });
});
