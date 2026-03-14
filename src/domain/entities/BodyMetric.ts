import { z } from 'zod';

const BodyMetricBaseSchema = z.object({
  athleteId:       z.string().uuid('Invalid athlete ID'),
  recordedAt:      z.date(),
  weightKg:        z.number().positive().max(500).optional(),
  waistCm:         z.number().positive().max(300).optional(),
  hipCm:           z.number().positive().max(300).optional(),
  bodyFatPercent:  z.number().min(1).max(70).optional(),
  notes:           z.string().max(300).optional(),
});

export const CreateBodyMetricSchema = BodyMetricBaseSchema.refine(
  (d) => d.weightKg !== undefined || d.waistCm !== undefined ||
         d.hipCm    !== undefined || d.bodyFatPercent !== undefined,
  { message: 'Al menos una métrica debe tener valor' },
);

// Extend the base (before refine) and add the refine again
export const BodyMetricSchema = BodyMetricBaseSchema.extend({
  id:        z.string().uuid(),
  createdAt: z.date(),
}).refine(
  (d) => d.weightKg !== undefined || d.waistCm !== undefined ||
         d.hipCm    !== undefined || d.bodyFatPercent !== undefined,
  { message: 'Al menos una métrica debe tener valor' },
);

export type CreateBodyMetricInput = z.infer<typeof CreateBodyMetricSchema>;
export type BodyMetric            = z.infer<typeof BodyMetricSchema>;
