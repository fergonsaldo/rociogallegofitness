import { z } from 'zod';

export const CARDIO_TYPES = [
  'running', 'cycling', 'swimming', 'elliptical',
  'rowing', 'jump_rope', 'walking', 'stair_climbing', 'other',
] as const;

export const CARDIO_INTENSITIES = ['low', 'medium', 'high'] as const;

export type CardioType      = typeof CARDIO_TYPES[number];
export type CardioIntensity = typeof CARDIO_INTENSITIES[number];

const CardioBaseSchema = z.object({
  coachId:            z.string().uuid('Invalid coach ID'),
  name:               z.string().min(1, 'El nombre es obligatorio').max(100),
  type:               z.enum(CARDIO_TYPES),
  intensity:          z.enum(CARDIO_INTENSITIES),
  durationMinMinutes: z.number().int().min(1).max(300),
  durationMaxMinutes: z.number().int().min(1).max(300),
  description:        z.string().max(500).optional(),
});

export const CreateCardioSchema = CardioBaseSchema.refine(
  (d) => d.durationMaxMinutes >= d.durationMinMinutes,
  { message: 'La duración máxima debe ser mayor o igual a la mínima', path: ['durationMaxMinutes'] },
);

export const CardioSchema = CardioBaseSchema.omit({ coachId: true }).extend({
  id:        z.string().uuid(),
  coachId:   z.string().uuid().nullable(),
  createdAt: z.date(),
});

export type CreateCardioInput = z.infer<typeof CreateCardioSchema>;
export type Cardio            = z.infer<typeof CardioSchema>;

/** Unified catalog type: coachId null = base catalog (read-only), uuid = coach-created */
export type CatalogCardio = Cardio & { coachId: string | null };
