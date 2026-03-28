/**
 * DocumentRemoteRepository tests — BUG-06
 * Verifies that uploadFile uses expo-file-system instead of fetch().blob()
 */

import { DocumentRemoteRepository } from '../../../src/infrastructure/supabase/remote/DocumentRemoteRepository';

// ── expo-file-system mock ──────────────────────────────────────────────────────
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
}));

// ── Supabase mock ──────────────────────────────────────────────────────────────
jest.mock('../../../src/infrastructure/supabase/client', () => {
  const upload          = jest.fn();
  const remove          = jest.fn();
  const createSignedUrl = jest.fn();
  const single          = jest.fn();
  const select          = jest.fn();
  const insert          = jest.fn();
  const dbDelete        = jest.fn();
  const eq              = jest.fn();
  const order           = jest.fn();

  const dbChain      = { select, insert, delete: dbDelete, eq, order, single };
  const storageChain = { upload, remove, createSignedUrl };

  select.mockReturnValue(dbChain);
  insert.mockReturnValue(dbChain);
  dbDelete.mockReturnValue(dbChain);
  eq.mockReturnValue(dbChain);
  order.mockReturnValue(dbChain);

  return {
    supabase: {
      from:    jest.fn(() => dbChain),
      storage: { from: jest.fn(() => storageChain) },
    },
    __mocks: { single, select, insert, dbDelete, eq, order, upload, remove, createSignedUrl, dbChain, storageChain },
  };
});

// ── Capture mock references ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const clientModule = require('../../../src/infrastructure/supabase/client');
const m = clientModule.__mocks as {
  upload: jest.Mock; remove: jest.Mock; createSignedUrl: jest.Mock;
  single: jest.Mock; insert: jest.Mock; eq: jest.Mock; select: jest.Mock;
  order: jest.Mock; dbChain: Record<string, jest.Mock>;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FileSystem = require('expo-file-system/legacy') as { readAsStringAsync: jest.Mock };

// ── atob mock (not available in jest environment) ──────────────────────────────
global.atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');

// ── Fixtures ───────────────────────────────────────────────────────────────────
const COACH_ID   = '00000000-0000-4000-c000-000000000001';
const ATHLETE_ID = '00000000-0000-4000-a000-000000000001';
const LOCAL_URI  = 'file:///tmp/photo.jpg';
const MIME_TYPE  = 'image/jpeg';

describe('DocumentRemoteRepository.uploadFile', () => {
  let repo: DocumentRemoteRepository;

  beforeEach(() => {
    repo = new DocumentRemoteRepository();
    jest.clearAllMocks();
  });

  it('reads file via FileSystem.readAsStringAsync', async () => {
    FileSystem.readAsStringAsync.mockResolvedValue('aGVsbG8='); // base64("hello")
    m.upload.mockResolvedValue({ error: null });

    await repo.uploadFile(COACH_ID, ATHLETE_ID, LOCAL_URI, MIME_TYPE);

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(LOCAL_URI, { encoding: 'base64' });
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledTimes(1);
  });

  it('uploads a Uint8Array (not a Blob)', async () => {
    FileSystem.readAsStringAsync.mockResolvedValue('aGVsbG8='); // "hello" in base64
    m.upload.mockResolvedValue({ error: null });

    await repo.uploadFile(COACH_ID, ATHLETE_ID, LOCAL_URI, MIME_TYPE);

    const uploadCall = m.upload.mock.calls[0];
    const uploadedData = uploadCall[1];
    expect(uploadedData).toBeInstanceOf(Uint8Array);
  });

  it('uses the correct content type and path structure', async () => {
    FileSystem.readAsStringAsync.mockResolvedValue('aGVsbG8=');
    m.upload.mockResolvedValue({ error: null });

    await repo.uploadFile(COACH_ID, ATHLETE_ID, LOCAL_URI, MIME_TYPE);

    const uploadCall = m.upload.mock.calls[0];
    const filePath   = uploadCall[0] as string;
    const options    = uploadCall[2] as { contentType: string };

    expect(filePath).toMatch(new RegExp(`^${COACH_ID}/${ATHLETE_ID}/\\d+\\.jpg$`));
    expect(options.contentType).toBe(MIME_TYPE);
  });

  it('returns the filePath and fileSize', async () => {
    const base64 = 'aGVsbG8='; // "hello" → 5 bytes
    FileSystem.readAsStringAsync.mockResolvedValue(base64);
    m.upload.mockResolvedValue({ error: null });

    const result = await repo.uploadFile(COACH_ID, ATHLETE_ID, LOCAL_URI, MIME_TYPE);

    expect(result.filePath).toMatch(/\.jpg$/);
    expect(result.fileSize).toBe(5); // "hello" is 5 bytes
  });

  it('strips query string from URI when extracting extension', async () => {
    const uriWithQuery = 'file:///tmp/photo.jpg?raw=true';
    FileSystem.readAsStringAsync.mockResolvedValue('aGVsbG8=');
    m.upload.mockResolvedValue({ error: null });

    const result = await repo.uploadFile(COACH_ID, ATHLETE_ID, uriWithQuery, MIME_TYPE);

    expect(result.filePath).toMatch(/\.jpg$/);
  });

  it('throws when storage upload fails', async () => {
    FileSystem.readAsStringAsync.mockResolvedValue('aGVsbG8=');
    m.upload.mockResolvedValue({ error: { message: 'Bucket not found' } });

    await expect(
      repo.uploadFile(COACH_ID, ATHLETE_ID, LOCAL_URI, MIME_TYPE),
    ).rejects.toThrow('Bucket not found');
  });
});
