import { supabase } from '../client';
import { IMessageRepository } from '@/domain/repositories/IMessageRepository';
import { Conversation, Message, SendMessageInput } from '@/domain/entities/Message';
import { ConversationRow, MessageRow } from '../database.types';

function mapMessageRow(row: MessageRow): Message {
  return {
    id:             row.id,
    conversationId: row.conversation_id,
    senderId:       row.sender_id,
    body:           row.body,
    sentAt:         new Date(row.sent_at),
    readAt:         row.read_at ? new Date(row.read_at) : null,
  };
}

function mapConversationRow(
  row: ConversationRow,
  extras: { otherUserName?: string; lastMessageBody?: string; lastMessageAt?: string; unreadCount: number }
): Conversation {
  return {
    id:              row.id,
    coachId:         row.coach_id,
    athleteId:       row.athlete_id,
    createdAt:       new Date(row.created_at),
    otherUserName:   extras.otherUserName,
    lastMessageBody: extras.lastMessageBody,
    lastMessageAt:   extras.lastMessageAt ? new Date(extras.lastMessageAt) : undefined,
    unreadCount:     extras.unreadCount,
  };
}

export class MessageRemoteRepository implements IMessageRepository {

  async getOrCreateConversation(coachId: string, athleteId: string): Promise<Conversation> {
    // Try to find existing conversation first
    const { data: existing, error: selectError } = await supabase
      .from('conversations')
      .select('*')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      return mapConversationRow(existing as ConversationRow, { unreadCount: 0 });
    }

    // Create new conversation
    const { data, error: insertError } = await supabase
      .from('conversations')
      .insert({ coach_id: coachId, athlete_id: athleteId })
      .select()
      .single();

    if (insertError || !data) throw insertError ?? new Error('Failed to create conversation');
    return mapConversationRow(data as ConversationRow, { unreadCount: 0 });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // Single query with embedded JOIN to get participant names inline
    const { data: convRows, error } = await supabase
      .from('conversations')
      .select(`
        id, coach_id, athlete_id, created_at,
        coach:users!conversations_coach_id_fkey(id, full_name),
        athlete:users!conversations_athlete_id_fkey(id, full_name)
      `)
      .or(`coach_id.eq.${userId},athlete_id.eq.${userId}`);

    if (error) throw error;
    if (!convRows || convRows.length === 0) return [];

    const convIds = convRows.map((c: any) => c.id);

    const [lastMsgsResult, unreadResult] = await Promise.all([
      supabase
        .from('messages')
        .select('conversation_id, body, sent_at')
        .in('conversation_id', convIds)
        .order('sent_at', { ascending: false }),
      supabase
        .from('messages')
        .select('conversation_id, id')
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .is('read_at', null),
    ]);

    if (lastMsgsResult.error) throw lastMsgsResult.error;
    if (unreadResult.error) throw unreadResult.error;

    const lastMsgByConv = new Map<string, { body: string; sent_at: string }>();
    for (const msg of lastMsgsResult.data ?? []) {
      if (!lastMsgByConv.has(msg.conversation_id)) {
        lastMsgByConv.set(msg.conversation_id, { body: msg.body, sent_at: msg.sent_at });
      }
    }

    const unreadByConv = new Map<string, number>();
    for (const msg of unreadResult.data ?? []) {
      unreadByConv.set(msg.conversation_id, (unreadByConv.get(msg.conversation_id) ?? 0) + 1);
    }

    const conversations = (convRows as any[]).map((row) => {
      const isCoach       = row.coach_id === userId;
      const otherUser     = isCoach ? row.athlete : row.coach;
      const otherUserName = (otherUser as any)?.full_name ?? undefined;
      const last          = lastMsgByConv.get(row.id);
      return mapConversationRow(
        { id: row.id, coach_id: row.coach_id, athlete_id: row.athlete_id, created_at: row.created_at },
        {
          otherUserName,
          lastMessageBody: last?.body,
          lastMessageAt:   last?.sent_at,
          unreadCount:     unreadByConv.get(row.id) ?? 0,
        }
      );
    });

    return conversations.sort((a, b) => {
      const aTime = a.lastMessageAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.lastMessageAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => mapMessageRow(row as MessageRow));
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: input.conversationId,
        sender_id:       input.senderId,
        body:            input.body,
        read_at:         null,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error('Failed to send message');
    return mapMessageRow(data as MessageRow);
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) throw error;
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Get conversation IDs for this user first
    const { data: convRows, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`coach_id.eq.${userId},athlete_id.eq.${userId}`);

    if (convError) throw convError;
    if (!convRows || convRows.length === 0) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convRows.map((c) => c.id))
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) throw error;
    return count ?? 0;
  }
}
