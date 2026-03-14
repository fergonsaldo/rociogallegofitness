import { act } from 'react';

// ── Mock MessageRemoteRepository ──────────────────────────────────────────────
jest.mock('../../../src/infrastructure/supabase/remote/MessageRemoteRepository', () => {
  const getOrCreateConversation = jest.fn();
  const getConversations        = jest.fn();
  const getMessages             = jest.fn();
  const sendMessage             = jest.fn();
  const markAsRead              = jest.fn();
  const getUnreadCount          = jest.fn();
  const repoMock = { getOrCreateConversation, getConversations, getMessages, sendMessage, markAsRead, getUnreadCount };
  return {
    MessageRemoteRepository: jest.fn().mockImplementation(() => repoMock),
    __repoMock: repoMock,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __repoMock: repoMock } = require('../../../src/infrastructure/supabase/remote/MessageRemoteRepository') as {
  __repoMock: Record<string, jest.Mock>;
};

// Importar el store una sola vez — resetModules invalida el mock capturado
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useMessageStore } = require('../../../src/presentation/stores/messageStore');

// ── Fixtures ──────────────────────────────────────────────────────────────────
const COACH_ID   = '00000000-0000-4000-a000-000000000001';
const ATHLETE_ID = '00000000-0000-4000-a000-000000000002';
const CONV_ID    = '00000000-0000-4000-a000-000000000003';
const MSG_ID     = '00000000-0000-4000-a000-000000000004';

const mockConversation = {
  id: CONV_ID, coachId: COACH_ID, athleteId: ATHLETE_ID,
  createdAt: new Date('2025-01-15T10:00:00Z'), unreadCount: 2,
  otherUserName: 'Ana García', lastMessageBody: 'Hola!',
};

const mockMessage = {
  id: MSG_ID, conversationId: CONV_ID, senderId: COACH_ID,
  body: 'Hola atleta!', sentAt: new Date('2025-01-15T10:00:00Z'), readAt: null,
};

function getState() { return useMessageStore.getState(); }

function resetStoreState() {
  useMessageStore.setState({
    conversations: [], messages: [], activeConvId: null,
    unreadCount: 0, isLoading: false, isSending: false, error: null,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('messageStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStoreState();
  });

  it('initial state has empty conversations and messages', () => {
    expect(getState().conversations).toEqual([]);
    expect(getState().messages).toEqual([]);
    expect(getState().unreadCount).toBe(0);
    expect(getState().isLoading).toBe(false);
  });

  it('fetchConversations populates conversations and unreadCount', async () => {
    repoMock.getConversations.mockResolvedValue([mockConversation]);
    await act(async () => { await getState().fetchConversations(COACH_ID); });
    expect(getState().conversations).toHaveLength(1);
    expect(getState().unreadCount).toBe(2);
    expect(getState().isLoading).toBe(false);
  });

  it('fetchConversations sets error when repository throws', async () => {
    repoMock.getConversations.mockRejectedValue(new Error('Network error'));
    await act(async () => { await getState().fetchConversations(COACH_ID); });
    expect(getState().error).toBe('Network error');
  });

  it('fetchMessages loads messages and marks as read', async () => {
    repoMock.getMessages.mockResolvedValue([mockMessage]);
    repoMock.markAsRead.mockResolvedValue(undefined);
    repoMock.getUnreadCount.mockResolvedValue(0);
    await act(async () => { await getState().fetchMessages(CONV_ID, COACH_ID); });
    expect(getState().messages).toHaveLength(1);
    expect(getState().messages[0].id).toBe(MSG_ID);
    expect(repoMock.markAsRead).toHaveBeenCalledWith(CONV_ID, COACH_ID);
  });

  it('sendMessage appends message to state optimistically', async () => {
    repoMock.sendMessage.mockResolvedValue(mockMessage);
    await act(async () => { await getState().sendMessage(CONV_ID, COACH_ID, 'Hola atleta!'); });
    expect(getState().messages).toHaveLength(1);
    expect(getState().messages[0].body).toBe('Hola atleta!');
    expect(getState().isSending).toBe(false);
  });

  it('sendMessage sets error when repository throws', async () => {
    repoMock.sendMessage.mockRejectedValue(new Error('Send failed'));
    await act(async () => { await getState().sendMessage(CONV_ID, COACH_ID, 'Hola!'); });
    expect(getState().error).toBe('Send failed');
    expect(getState().isSending).toBe(false);
  });

  it('setActiveConversation resets messages and sets activeConvId', () => {
    act(() => { getState().setActiveConversation(CONV_ID); });
    expect(getState().activeConvId).toBe(CONV_ID);
    expect(getState().messages).toEqual([]);
  });

  it('setActiveConversation with null clears active conversation', () => {
    act(() => { getState().setActiveConversation(null); });
    expect(getState().activeConvId).toBeNull();
  });

  it('clearError resets error to null', async () => {
    repoMock.getConversations.mockRejectedValue(new Error('err'));
    await act(async () => { await getState().fetchConversations(COACH_ID); });
    expect(getState().error).toBeTruthy();
    act(() => { getState().clearError(); });
    expect(getState().error).toBeNull();
  });

  it('refreshUnreadCount updates badge count silently', async () => {
    repoMock.getUnreadCount.mockResolvedValue(5);
    await act(async () => { await getState().refreshUnreadCount(COACH_ID); });
    expect(getState().unreadCount).toBe(5);
  });

  it('refreshUnreadCount does not throw when repository fails', async () => {
    repoMock.getUnreadCount.mockRejectedValue(new Error('silent fail'));
    await expect(
      act(async () => { await getState().refreshUnreadCount(COACH_ID); })
    ).resolves.toBeUndefined();
  });

  it('getOrOpenConversation delegates to repository and returns conversation', async () => {
    repoMock.getOrCreateConversation.mockResolvedValue(mockConversation);
    let result: typeof mockConversation | undefined;
    await act(async () => {
      result = await getState().getOrOpenConversation(COACH_ID, ATHLETE_ID);
    });
    expect(result!.id).toBe(CONV_ID);
    expect(repoMock.getOrCreateConversation).toHaveBeenCalledWith(COACH_ID, ATHLETE_ID);
  });
});
