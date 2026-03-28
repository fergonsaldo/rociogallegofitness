import { z } from 'zod';

export const TagAutomationSchema = z.object({
  id:               z.string().uuid(),
  tagId:            z.string().uuid(),
  routineId:        z.string().uuid().nullable(),
  cardioId:         z.string().uuid().nullable(),
  nutritionPlanId:  z.string().uuid().nullable(),
  createdAt:        z.date(),
});

export const SaveTagAutomationSchema = z.object({
  routineId:       z.string().uuid().nullable().optional(),
  cardioId:        z.string().uuid().nullable().optional(),
  nutritionPlanId: z.string().uuid().nullable().optional(),
});

export type TagAutomation         = z.infer<typeof TagAutomationSchema>;
export type SaveTagAutomationInput = z.infer<typeof SaveTagAutomationSchema>;
