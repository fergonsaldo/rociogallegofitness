import { create } from 'zustand';
import { Conversation, Message } from '@/domain/entities/Message';
import { MessageRemoteRepository } from '@/infrastructure/supabase/remote/MessageRemoteRepository';
import {
  getConversationsUseCase,
  getMessagesUseCase,
  sendMessageUseCase,
  markAsReadUseCase,
  getUnreadCountUseCase,
  getOrCreateConversationUseCase,
} from '@/application/messaging/MessageUseCases';

const repo = new MessageRemoteRepository();

interface MessageState {
  conversations:   Conversation[];
  messages:        Message[];
  activeConvId:    string | null;
  unreadCount:     number;
  isLoading:       boolean;
  isSending:       boolean;
  error:           string | null;

  // Actions
  fetchConversations:      (userId: string) => Promise<void>;
  fetchMessages:           (conversationId: string, userId: string) => Promise<void>;
  sendMessage:             (conversationId: string, senderId: string, body: string) => Promise<void>;
  getOrOpenConversation:   (coachId: string, athleteId: string) => Promise<Conversation>;
  refreshUnreadCount:      (userId: string) => Promise<void>;
  setActiveConversation:   (convId: string | null) => void;
  clearError:              () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations:  [],
  messages:       [],
  activeConvId:   null,
  unreadCount:    0,
  isLoading:      false,
  isSending:      false,
  error:          null,

  fetchConversations: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await getConversationsUseCase(userId, repo);
      const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      set({ conversations, unreadCount, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchMessages: async (conversationId, userId) => {
    set({ isLoading: true, error: null, activeConvId: conversationId });
    try {
      const [messages] = await Promise.all([
        getMessagesUseCase(conversationId, repo),
        markAsReadUseCase(conversationId, userId, repo),
      ]);
      set({ messages, isLoading: false });
      // Refresh unread badge after marking as read
      const unreadCount = await getUnreadCountUseCase(userId, repo);
      set({ unreadCount });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  sendMessage: async (conversationId, senderId, body) => {
    set({ isSending: true, error: null });
    try {
      const message = await sendMessageUseCase({ conversationId, senderId, body }, repo);
      // Optimistic append
      set((s) => ({ messages: [...s.messages, message], isSending: false }));
    } catch (err) {
      set({ error: (err as Error).message, isSending: false });
    }
  },

  getOrOpenConversation: async (coachId, athleteId) => {
    const conversation = await getOrCreateConversationUseCase(coachId, athleteId, repo);
    return conversation;
  },

  refreshUnreadCount: async (userId) => {
    try {
      const unreadCount = await getUnreadCountUseCase(userId, repo);
      set({ unreadCount });
    } catch {
      // Silent — badge update is non-critical
    }
  },

  setActiveConversation: (convId) => set({ activeConvId: convId, messages: [] }),

  clearError: () => set({ error: null }),
}));
