import { z } from 'zod';

export const ProgressRecordSchema = z.object({
  id: z.string().uuid(),
  athleteId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  recordedAt: z.date(),
  bestWeightKg: z.number().min(0).optional(),
  bestReps: z.number().int().min(1).optional(),
  estimatedOneRepMaxKg: z.number().min(0).optional(),
  totalVolumeKg: z.number().min(0),
  sessionId: z.string().uuid(),
});

export type ProgressRecord = z.infer<typeof ProgressRecordSchema>;

export const CreateProgressRecordSchema = ProgressRecordSchema.omit({ id: true });
export type CreateProgressRecordInput = z.infer<typeof CreateProgressRecordSchema>;
