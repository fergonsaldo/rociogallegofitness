import { z } from 'zod';

export const CreateCoachSessionSchema = z.object({
  coachId:         z.string().uuid('ID de coach inválido'),
  athleteId:       z.string().uuid().nullable().default(null),
  title:           z.string().max(100).nullable().default(null),
  sessionType:     z.string().min(1).max(50).default('Entrenamiento'),
  modality:        z.enum(['online', 'in_person']).default('in_person'),
  scheduledAt:     z.date(),
  durationMinutes: z.number().int().min(1, 'La duración mínima es 1 minuto').max(480).default(60),
  notes:           z.string().nullable().default(null),
});

export const CoachSessionSchema = CreateCoachSessionSchema.extend({
  id:          z.string().uuid(),
  athleteName: z.string().nullable().default(null),
  createdAt:   z.date(),
});

export const UpdateCoachSessionSchema = z.object({
  athleteId:       z.string().uuid().nullable().optional(),
  title:           z.string().max(100).nullable().optional(),
  sessionType:     z.string().min(1).max(50).optional(),
  modality:        z.enum(['online', 'in_person']).optional(),
  scheduledAt:     z.date().optional(),
  durationMinutes: z.number().int().min(1, 'La duración mínima es 1 minuto').max(480).optional(),
  notes:           z.string().nullable().optional(),
});

export type CreateCoachSessionInput = z.infer<typeof CreateCoachSessionSchema>;
export type UpdateCoachSessionInput = z.infer<typeof UpdateCoachSessionSchema>;
export type CoachSession            = z.infer<typeof CoachSessionSchema>;
