import { z } from 'zod';

// ── Blocked extensions ────────────────────────────────────────────────────────

export const BLOCKED_EXTENSIONS = [
  '.exe', '.apk', '.sh', '.bat', '.cmd',
  '.ps1', '.msi', '.deb', '.dmg', '.bin',
] as const;

// ── Schemas ───────────────────────────────────────────────────────────────────

export const DocumentSchema = z.object({
  id:          z.string().uuid(),
  coachId:     z.string().uuid(),
  athleteId:   z.string().uuid(),
  name:        z.string().min(1).max(200),
  filePath:    z.string().min(1),
  fileSize:    z.number().positive(),
  mimeType:    z.string().min(1),
  uploadedBy:  z.string().uuid(),
  createdAt:   z.date(),
  // Not stored — generated at read time
  downloadUrl: z.string().nullable(),
});

export const CreateDocumentSchema = z.object({
  coachId:    z.string().uuid('Coach ID inválido'),
  athleteId:  z.string().uuid('Athlete ID inválido'),
  name:       z.string().min(1, 'El nombre es obligatorio').max(200),
  filePath:   z.string().min(1),
  fileSize:   z.number().positive(),
  mimeType:   z.string().min(1),
  uploadedBy: z.string().uuid(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type Document            = z.infer<typeof DocumentSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
