import { z } from 'zod';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const CreateClientTagSchema = z.object({
  coachId: z.string().uuid('Invalid coach ID'),
  name:    z.string().min(1, 'El nombre es obligatorio').max(50),
  color:   z.string().regex(HEX_COLOR_REGEX, 'Color hexadecimal inválido').default('#6B7280'),
});

export const ClientTagSchema = CreateClientTagSchema.extend({
  id:           z.string().uuid(),
  clientCount:  z.number().int().min(0).default(0),
  createdAt:    z.date(),
});

export type CreateClientTagInput = z.infer<typeof CreateClientTagSchema>;
export type ClientTag             = z.infer<typeof ClientTagSchema>;
