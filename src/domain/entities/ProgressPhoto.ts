import { z } from 'zod';

export const PHOTO_TAGS = ['front', 'back', 'side'] as const;
export type PhotoTag = typeof PHOTO_TAGS[number];

export const PHOTO_TAG_LABELS: Record<PhotoTag, string> = {
  front: 'Frente',
  back:  'Espalda',
  side:  'Lateral',
};

export const CreateProgressPhotoSchema = z.object({
  athleteId:   z.string().uuid('Invalid athlete ID'),
  takenAt:     z.date(),
  tag:         z.enum(PHOTO_TAGS),
  notes:       z.string().max(300).optional(),
  /** Storage path returned by Supabase after upload */
  storagePath: z.string().min(1),
});

export const ProgressPhotoSchema = CreateProgressPhotoSchema.extend({
  id:        z.string().uuid(),
  /** Signed URL generated at read time — expires after 1 hour, never persisted */
  signedUrl: z.string().url(),
  createdAt: z.date(),
});

export type CreateProgressPhotoInput = z.infer<typeof CreateProgressPhotoSchema>;
export type ProgressPhoto            = z.infer<typeof ProgressPhotoSchema>;
