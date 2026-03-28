import { z } from 'zod';

const YOUTUBE_URL_REGEX =
  /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]+/;

export const CreateVideoSchema = z.object({
  coachId:          z.string().uuid('Invalid coach ID'),
  title:            z.string().min(1, 'El título es obligatorio').max(100),
  url:              z.string().regex(YOUTUBE_URL_REGEX, 'La URL debe ser de YouTube'),
  tags:             z.array(z.string().min(1).max(50)).default([]),
  description:      z.string().max(500).optional(),
  visibleToClients: z.boolean().default(false),
});

export const VideoSchema = CreateVideoSchema.omit({ coachId: true }).extend({
  id:        z.string().uuid(),
  coachId:   z.string().uuid(),
  createdAt: z.date(),
});

export const UpdateVideoSchema = z.object({
  title:            z.string().min(1, 'El título es obligatorio').max(100).optional(),
  url:              z.string().regex(YOUTUBE_URL_REGEX, 'La URL debe ser de YouTube').optional(),
  tags:             z.array(z.string().min(1).max(50)).optional(),
  description:      z.string().max(500).optional(),
  visibleToClients: z.boolean().optional(),
});

export type CreateVideoInput = z.infer<typeof CreateVideoSchema>;
export type UpdateVideoInput = z.infer<typeof UpdateVideoSchema>;
export type Video            = z.infer<typeof VideoSchema>;
