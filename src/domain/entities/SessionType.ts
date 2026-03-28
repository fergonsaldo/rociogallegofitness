import { z } from 'zod';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const CreateSessionTypeSchema = z.object({
  coachId: z.string().uuid('Invalid coach ID'),
  name:    z.string().min(1, 'El nombre es obligatorio').max(50),
  color:   z.string().regex(HEX_COLOR_REGEX, 'Color hexadecimal inválido').default('#6B7280'),
});

export const SessionTypeSchema = CreateSessionTypeSchema.extend({
  id:        z.string().uuid(),
  createdAt: z.date(),
});

export type CreateSessionTypeInput = z.infer<typeof CreateSessionTypeSchema>;
export type SessionType            = z.infer<typeof SessionTypeSchema>;
