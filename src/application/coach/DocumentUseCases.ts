import { Document, CreateDocumentSchema, BLOCKED_EXTENSIONS } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';

// ── isBlockedExtension (pure) ─────────────────────────────────────────────────

export function isBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// ── GetDocuments ──────────────────────────────────────────────────────────────

export async function getDocumentsUseCase(
  coachId: string,
  athleteId: string,
  repo: IDocumentRepository,
): Promise<Document[]> {
  if (!coachId)   throw new Error('coachId is required');
  if (!athleteId) throw new Error('athleteId is required');
  return repo.getDocuments(coachId, athleteId);
}

// ── UploadDocument ────────────────────────────────────────────────────────────

export async function uploadDocumentUseCase(
  coachId: string,
  athleteId: string,
  uploadedBy: string,
  name: string,
  localUri: string,
  mimeType: string,
  repo: IDocumentRepository,
): Promise<Document> {
  if (!coachId)   throw new Error('coachId is required');
  if (!athleteId) throw new Error('athleteId is required');
  if (isBlockedExtension(name)) {
    throw new Error('Este tipo de archivo no está permitido');
  }

  const { filePath, fileSize } = await repo.uploadFile(coachId, athleteId, localUri, mimeType);

  const input = CreateDocumentSchema.parse({
    coachId,
    athleteId,
    name,
    filePath,
    fileSize,
    mimeType,
    uploadedBy,
  });

  return repo.uploadDocument(input);
}

// ── DeleteDocument ────────────────────────────────────────────────────────────

export async function deleteDocumentUseCase(
  doc: Document,
  repo: IDocumentRepository,
): Promise<void> {
  if (!doc.id) throw new Error('id is required');
  return repo.deleteDocument(doc);
}
