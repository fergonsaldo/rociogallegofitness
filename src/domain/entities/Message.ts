import { z } from 'zod';

// ── Conversation ──────────────────────────────────────────────────────────────

export const ConversationSchema = z.object({
  id:         z.string().uuid(),
  coachId:    z.string().uuid(),
  athleteId:  z.string().uuid(),
  createdAt:  z.date(),
  // Denormalized fields populated at read time
  otherUserName:    z.string().optional(),
  lastMessageBody:  z.string().optional(),
  lastMessageAt:    z.date().optional(),
  unreadCount:      z.number().int().min(0).default(0),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// ── Message ───────────────────────────────────────────────────────────────────

export const MessageSchema = z.object({
  id:             z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId:       z.string().uuid(),
  body:           z.string().trim().min(1),
  sentAt:         z.date(),
  readAt:         z.date().nullable(),
});

export type Message = z.infer<typeof MessageSchema>;

export const SendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  senderId:       z.string().uuid(),
  body:           z.string().trim().min(1, 'El mensaje no puede estar vacío'),
});

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;
