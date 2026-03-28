import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const CreateScheduleSchema = z.object({
  coachId:             z.string().uuid('ID de coach inválido'),
  title:               z.string().min(1, 'El título es obligatorio').max(100),
  startDate:           z.date(),
  endDate:             z.date(),
  startTime:           z.string().regex(TIME_REGEX, 'Formato HH:MM requerido'),
  endTime:             z.string().regex(TIME_REGEX, 'Formato HH:MM requerido'),
  slotDurationMinutes: z.number().int().min(15, 'Mínimo 15 minutos').max(480, 'Máximo 8 horas'),
  modality:            z.enum(['online', 'in_person']),
  isActive:            z.boolean().default(true),
});

export const ScheduleSchema = CreateScheduleSchema.extend({
  id:        z.string().uuid(),
  createdAt: z.date(),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type Schedule            = z.infer<typeof ScheduleSchema>;
