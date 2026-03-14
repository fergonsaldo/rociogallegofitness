import { Conversation } from '../entities/Message';
import { Message, SendMessageInput } from '../entities/Message';

export interface IMessageRepository {
  /**
   * Returns the existing conversation between coach and athlete,
   * or creates a new one if it does not exist yet.
   */
  getOrCreateConversation(coachId: string, athleteId: string): Promise<Conversation>;

  /**
   * Returns all conversations for a user, enriched with last message
   * and unread count. Ordered by last message desc.
   */
  getConversations(userId: string): Promise<Conversation[]>;

  /**
   * Returns all messages of a conversation ordered by sentAt ASC.
   */
  getMessages(conversationId: string): Promise<Message[]>;

  /**
   * Inserts a new message.
   */
  sendMessage(input: SendMessageInput): Promise<Message>;

  /**
   * Marks all messages in a conversation as read where sender ≠ userId.
   */
  markAsRead(conversationId: string, userId: string): Promise<void>;

  /**
   * Returns the total unread count across all conversations for a user.
   */
  getUnreadCount(userId: string): Promise<number>;
}
