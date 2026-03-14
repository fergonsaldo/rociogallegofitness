import {
  getOrCreateConversationUseCase,
  getConversationsUseCase,
  getMessagesUseCase,
  sendMessageUseCase,
  markAsReadUseCase,
  getUnreadCountUseCase,
} from '../../src/application/messaging/MessageUseCases';
import { IMessageRepository } from '../../src/domain/repositories/IMessageRepository';
import { Conversation, Message } from '../../src/domain/entities/Message';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const COACH_ID   = '00000000-0000-4000-a000-000000000001';
const ATHLETE_ID = '00000000-0000-4000-a000-000000000002';
const CONV_ID    = '00000000-0000-4000-a000-000000000003';
const MSG_ID     = '00000000-0000-4000-a000-000000000004';

const mockConversation: Conversation = {
  id:         CONV_ID,
  coachId:    COACH_ID,
  athleteId:  ATHLETE_ID,
  createdAt:  new Date('2025-01-15T10:00:00Z'),
  unreadCount: 0,
};

const mockMessage: Message = {
  id:             MSG_ID,
  conversationId: CONV_ID,
  senderId:       COACH_ID,
  body:           'Hola atleta!',
  sentAt:         new Date('2025-01-15T10:00:00Z'),
  readAt:         null,
};

function makeMockRepo(overrides: Partial<IMessageRepository> = {}): IMessageRepository {
  return {
    getOrCreateConversation: jest.fn().mockResolvedValue(mockConversation),
    getConversations:        jest.fn().mockResolvedValue([mockConversation]),
    getMessages:             jest.fn().mockResolvedValue([mockMessage]),
    sendMessage:             jest.fn().mockResolvedValue(mockMessage),
    markAsRead:              jest.fn().mockResolvedValue(undefined),
    getUnreadCount:          jest.fn().mockResolvedValue(2),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getOrCreateConversationUseCase', () => {
  it('calls repository with correct coachId and athleteId', async () => {
    const repo = makeMockRepo();
    await getOrCreateConversationUseCase(COACH_ID, ATHLETE_ID, repo);
    expect(repo.getOrCreateConversation).toHaveBeenCalledWith(COACH_ID, ATHLETE_ID);
  });

  it('returns the conversation from the repository', async () => {
    const result = await getOrCreateConversationUseCase(COACH_ID, ATHLETE_ID, makeMockRepo());
    expect(result.id).toBe(CONV_ID);
  });

  it('throws when coachId is empty', async () => {
    await expect(
      getOrCreateConversationUseCase('', ATHLETE_ID, makeMockRepo())
    ).rejects.toThrow();
  });

  it('throws when athleteId is empty', async () => {
    await expect(
      getOrCreateConversationUseCase(COACH_ID, '', makeMockRepo())
    ).rejects.toThrow();
  });
});

describe('getConversationsUseCase', () => {
  it('returns conversations for the given userId', async () => {
    const repo = makeMockRepo();
    const result = await getConversationsUseCase(COACH_ID, repo);
    expect(result).toHaveLength(1);
    expect(repo.getConversations).toHaveBeenCalledWith(COACH_ID);
  });

  it('throws when userId is empty', async () => {
    await expect(getConversationsUseCase('', makeMockRepo())).rejects.toThrow();
  });
});

describe('getMessagesUseCase', () => {
  it('returns messages for the given conversationId', async () => {
    const repo = makeMockRepo();
    const result = await getMessagesUseCase(CONV_ID, repo);
    expect(result).toHaveLength(1);
    expect(repo.getMessages).toHaveBeenCalledWith(CONV_ID);
  });

  it('throws when conversationId is empty', async () => {
    await expect(getMessagesUseCase('', makeMockRepo())).rejects.toThrow();
  });
});

describe('sendMessageUseCase', () => {
  const validInput = { conversationId: CONV_ID, senderId: COACH_ID, body: 'Hola!' };

  it('sends message and returns the created message', async () => {
    const repo = makeMockRepo();
    const result = await sendMessageUseCase(validInput, repo);
    expect(result.id).toBe(MSG_ID);
    expect(repo.sendMessage).toHaveBeenCalledWith(validInput);
  });

  it('throws ZodError when body is empty', async () => {
    await expect(
      sendMessageUseCase({ ...validInput, body: '' }, makeMockRepo())
    ).rejects.toThrow();
  });

  it('throws ZodError when body is whitespace only', async () => {
    await expect(
      sendMessageUseCase({ ...validInput, body: '   ' }, makeMockRepo())
    ).rejects.toThrow();
  });

  it('throws ZodError when conversationId is not a UUID', async () => {
    await expect(
      sendMessageUseCase({ ...validInput, conversationId: 'not-a-uuid' }, makeMockRepo())
    ).rejects.toThrow();
  });
});

describe('markAsReadUseCase', () => {
  it('calls repository with correct arguments', async () => {
    const repo = makeMockRepo();
    await markAsReadUseCase(CONV_ID, COACH_ID, repo);
    expect(repo.markAsRead).toHaveBeenCalledWith(CONV_ID, COACH_ID);
  });

  it('throws when conversationId is empty', async () => {
    await expect(markAsReadUseCase('', COACH_ID, makeMockRepo())).rejects.toThrow();
  });

  it('throws when userId is empty', async () => {
    await expect(markAsReadUseCase(CONV_ID, '', makeMockRepo())).rejects.toThrow();
  });
});

describe('getUnreadCountUseCase', () => {
  it('returns unread count from repository', async () => {
    const count = await getUnreadCountUseCase(COACH_ID, makeMockRepo());
    expect(count).toBe(2);
  });

  it('returns 0 when userId is empty without calling repository', async () => {
    const repo = makeMockRepo();
    const count = await getUnreadCountUseCase('', repo);
    expect(count).toBe(0);
    expect(repo.getUnreadCount).not.toHaveBeenCalled();
  });
});
