import { IMessageRepository } from '@/domain/repositories/IMessageRepository';
import { Conversation, Message, SendMessageInputSchema } from '@/domain/entities/Message';

export async function getOrCreateConversationUseCase(
  coachId: string,
  athleteId: string,
  repository: IMessageRepository
): Promise<Conversation> {
  if (!coachId || !athleteId) throw new Error('coachId y athleteId son obligatorios');
  return repository.getOrCreateConversation(coachId, athleteId);
}

export async function getConversationsUseCase(
  userId: string,
  repository: IMessageRepository
): Promise<Conversation[]> {
  if (!userId) throw new Error('userId es obligatorio');
  return repository.getConversations(userId);
}

export async function getMessagesUseCase(
  conversationId: string,
  repository: IMessageRepository
): Promise<Message[]> {
  if (!conversationId) throw new Error('conversationId es obligatorio');
  return repository.getMessages(conversationId);
}

export async function sendMessageUseCase(
  input: { conversationId: string; senderId: string; body: string },
  repository: IMessageRepository
): Promise<Message> {
  const parsed = SendMessageInputSchema.parse(input);
  return repository.sendMessage(parsed);
}

export async function markAsReadUseCase(
  conversationId: string,
  userId: string,
  repository: IMessageRepository
): Promise<void> {
  if (!conversationId || !userId) throw new Error('conversationId y userId son obligatorios');
  return repository.markAsRead(conversationId, userId);
}

export async function getUnreadCountUseCase(
  userId: string,
  repository: IMessageRepository
): Promise<number> {
  if (!userId) return 0;
  return repository.getUnreadCount(userId);
}
