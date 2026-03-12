import { z } from 'zod';

export const CreateBodyMetricSchema = z.object({
  athleteId:       z.string().uuid('Invalid athlete ID'),
  recordedAt:      z.date(),
  weightKg:        z.number().positive().max(500).optional(),
  waistCm:         z.number().positive().max(300).optional(),
  hipCm:           z.number().positive().max(300).optional(),
  bodyFatPercent:  z.number().min(1).max(70).optional(),
  notes:           z.string().max(300).optional(),
}).refine(
  (d) => d.weightKg !== undefined || d.waistCm !== undefined ||
         d.hipCm    !== undefined || d.bodyFatPercent !== undefined,
  { message: 'Al menos una métrica debe tener valor' },
);

export const BodyMetricSchema = CreateBodyMetricSchema.extend({
  id:        z.string().uuid(),
  createdAt: z.date(),
});

export type CreateBodyMetricInput = z.infer<typeof CreateBodyMetricSchema>;
export type BodyMetric            = z.infer<typeof BodyMetricSchema>;
