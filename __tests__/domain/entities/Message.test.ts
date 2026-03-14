import { MessageSchema, ConversationSchema, SendMessageInputSchema } from '../../../src/domain/entities/Message';

const COACH_ID   = '00000000-0000-4000-a000-000000000001';
const ATHLETE_ID = '00000000-0000-4000-a000-000000000002';
const CONV_ID    = '00000000-0000-4000-a000-000000000003';
const MSG_ID     = '00000000-0000-4000-a000-000000000004';

describe('MessageSchema', () => {
  const validMessage = {
    id:             MSG_ID,
    conversationId: CONV_ID,
    senderId:       COACH_ID,
    body:           'Hola!',
    sentAt:         new Date('2025-01-15T10:00:00Z'),
    readAt:         null,
  };

  it('parses a valid message', () => {
    const result = MessageSchema.parse(validMessage);
    expect(result.id).toBe(MSG_ID);
    expect(result.body).toBe('Hola!');
    expect(result.readAt).toBeNull();
  });

  it('parses a read message with readAt as Date', () => {
    const readMessage = { ...validMessage, readAt: new Date('2025-01-15T11:00:00Z') };
    const result = MessageSchema.parse(readMessage);
    expect(result.readAt).toBeInstanceOf(Date);
  });

  it('rejects empty body', () => {
    expect(() => MessageSchema.parse({ ...validMessage, body: '' })).toThrow();
  });

  it('rejects invalid UUID for id', () => {
    expect(() => MessageSchema.parse({ ...validMessage, id: 'not-a-uuid' })).toThrow();
  });

  it('rejects invalid UUID for conversationId', () => {
    expect(() => MessageSchema.parse({ ...validMessage, conversationId: 'bad' })).toThrow();
  });
});

describe('ConversationSchema', () => {
  const validConversation = {
    id:          CONV_ID,
    coachId:     COACH_ID,
    athleteId:   ATHLETE_ID,
    createdAt:   new Date('2025-01-15T10:00:00Z'),
    unreadCount: 0,
  };

  it('parses a valid conversation', () => {
    const result = ConversationSchema.parse(validConversation);
    expect(result.id).toBe(CONV_ID);
    expect(result.unreadCount).toBe(0);
  });

  it('defaults unreadCount to 0 when not provided', () => {
    const { unreadCount, ...withoutCount } = validConversation;
    const result = ConversationSchema.parse(withoutCount);
    expect(result.unreadCount).toBe(0);
  });

  it('accepts optional fields otherUserName and lastMessageBody', () => {
    const result = ConversationSchema.parse({
      ...validConversation,
      otherUserName:   'Ana García',
      lastMessageBody: 'Hola!',
    });
    expect(result.otherUserName).toBe('Ana García');
    expect(result.lastMessageBody).toBe('Hola!');
  });

  it('rejects negative unreadCount', () => {
    expect(() => ConversationSchema.parse({ ...validConversation, unreadCount: -1 })).toThrow();
  });

  it('rejects invalid UUID for coachId', () => {
    expect(() => ConversationSchema.parse({ ...validConversation, coachId: 'bad' })).toThrow();
  });
});

describe('SendMessageInputSchema', () => {
  const validInput = {
    conversationId: CONV_ID,
    senderId:       COACH_ID,
    body:           'Hola!',
  };

  it('parses valid input', () => {
    const result = SendMessageInputSchema.parse(validInput);
    expect(result.body).toBe('Hola!');
  });

  it('rejects empty body', () => {
    expect(() => SendMessageInputSchema.parse({ ...validInput, body: '' })).toThrow();
  });

  it('rejects invalid UUID for conversationId', () => {
    expect(() => SendMessageInputSchema.parse({ ...validInput, conversationId: 'bad' })).toThrow();
  });

  it('rejects invalid UUID for senderId', () => {
    expect(() => SendMessageInputSchema.parse({ ...validInput, senderId: 'bad' })).toThrow();
  });

  it('accepts long messages up to any length', () => {
    const longBody = 'a'.repeat(2000);
    const result = SendMessageInputSchema.parse({ ...validInput, body: longBody });
    expect(result.body).toHaveLength(2000);
  });
});
