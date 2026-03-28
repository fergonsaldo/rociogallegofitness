import { z } from 'zod';

export const CreateAthleteGroupSchema = z.object({
  coachId:     z.string().uuid('Invalid coach ID'),
  name:        z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(300, 'Máximo 300 caracteres').nullable().optional(),
});

export const UpdateAthleteGroupSchema = z.object({
  name:        z.string().min(1, 'El nombre es obligatorio').max(100).optional(),
  description: z.string().max(300).nullable().optional(),
});

export const AthleteGroupSchema = CreateAthleteGroupSchema.extend({
  id:          z.string().uuid(),
  memberCount: z.number().int().min(0).default(0),
  createdAt:   z.date(),
});

export type CreateAthleteGroupInput = z.infer<typeof CreateAthleteGroupSchema>;
export type UpdateAthleteGroupInput = z.infer<typeof UpdateAthleteGroupSchema>;
export type AthleteGroup            = z.infer<typeof AthleteGroupSchema>;
