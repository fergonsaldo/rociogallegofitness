import { MessageRemoteRepository } from '../../../src/infrastructure/supabase/remote/MessageRemoteRepository';
import { SendMessageInput } from '../../../src/domain/entities/Message';

// ── Supabase mock ─────────────────────────────────────────────────────────────
jest.mock('../../../src/infrastructure/supabase/client', () => {
  const single      = jest.fn();
  const select      = jest.fn();
  const insert      = jest.fn();
  const update      = jest.fn();
  const eq          = jest.fn();
  const neq         = jest.fn();
  const or          = jest.fn();
  const order       = jest.fn();
  const maybeSingle = jest.fn();
  const is          = jest.fn();
  const inFn        = jest.fn();

  const chain = { select, insert, update, eq, neq, or, order, single, maybeSingle, is, in: inFn };

  select.mockReturnValue(chain);
  insert.mockReturnValue(chain);
  update.mockReturnValue(chain);
  eq.mockReturnValue(chain);
  neq.mockReturnValue(chain);
  or.mockReturnValue(chain);
  order.mockReturnValue(chain);
  is.mockReturnValue(chain);
  inFn.mockReturnValue(chain);

  return {
    supabase: { from: jest.fn(() => chain) },
    __mocks: { single, select, insert, update, eq, neq, or, order, maybeSingle, is, inFn, chain },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const clientModule = require('../../../src/infrastructure/supabase/client');
const { supabase } = clientModule;
const m = clientModule.__mocks as Record<string, jest.Mock>;

// ── Fixtures ──────────────────────────────────────────────────────────────────
const COACH_ID   = '00000000-0000-4000-a000-000000000001';
const ATHLETE_ID = '00000000-0000-4000-a000-000000000002';
const CONV_ID    = 'conv-0001-0000-0000-0000-000000000000';
const MSG_ID     = 'msg--0001-0000-0000-0000-000000000000';
const NOW_ISO    = '2025-01-15T10:00:00.000Z';

const CONV_ROW = {
  id:         CONV_ID,
  coach_id:   COACH_ID,
  athlete_id: ATHLETE_ID,
  created_at: NOW_ISO,
};

const MSG_ROW = {
  id:              MSG_ID,
  conversation_id: CONV_ID,
  sender_id:       COACH_ID,
  body:            'Hola atleta!',
  sent_at:         NOW_ISO,
  read_at:         null,
};

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockReturnValue(m.chain);
  m.select.mockReturnValue(m.chain);
  m.insert.mockReturnValue(m.chain);
  m.update.mockReturnValue(m.chain);
  m.eq.mockReturnValue(m.chain);
  m.neq.mockReturnValue(m.chain);
  m.or.mockReturnValue(m.chain);
  m.order.mockReturnValue(m.chain);
  m.is.mockReturnValue(m.chain);
  m.inFn.mockReturnValue(m.chain);
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('MessageRemoteRepository', () => {
  let repo: MessageRemoteRepository;

  beforeEach(() => {
    repo = new MessageRemoteRepository();
  });

  // ── getOrCreateConversation ──────────────────────────────────────────────

  describe('getOrCreateConversation', () => {
    it('returns existing conversation when one already exists', async () => {
      m.maybeSingle.mockResolvedValue({ data: CONV_ROW, error: null });
      m.eq.mockReturnValue({ ...m.chain, eq: jest.fn().mockReturnValue({ ...m.chain, maybeSingle: m.maybeSingle }) });

      const result = await repo.getOrCreateConversation(COACH_ID, ATHLETE_ID);

      expect(result.id).toBe(CONV_ID);
      expect(result.coachId).toBe(COACH_ID);
      expect(result.athleteId).toBe(ATHLETE_ID);
    });

    it('creates a new conversation when none exists', async () => {
      m.maybeSingle.mockResolvedValue({ data: null, error: null });
      const singleMock = jest.fn().mockResolvedValue({ data: CONV_ROW, error: null });
      m.eq.mockReturnValue({
        ...m.chain,
        eq: jest.fn().mockReturnValue({ ...m.chain, maybeSingle: m.maybeSingle }),
      });
      m.select.mockReturnValue({ ...m.chain, single: singleMock });
      m.insert.mockReturnValue({ select: m.select });

      const result = await repo.getOrCreateConversation(COACH_ID, ATHLETE_ID);

      expect(result.coachId).toBe(COACH_ID);
      expect(result.athleteId).toBe(ATHLETE_ID);
    });

    it('throws when supabase returns an error on select', async () => {
      m.maybeSingle.mockResolvedValue({ data: null, error: new Error('DB error') });
      m.eq.mockReturnValue({
        ...m.chain,
        eq: jest.fn().mockReturnValue({ ...m.chain, maybeSingle: m.maybeSingle }),
      });

      await expect(repo.getOrCreateConversation(COACH_ID, ATHLETE_ID)).rejects.toThrow('DB error');
    });
  });

  // ── getMessages ──────────────────────────────────────────────────────────

  describe('getMessages', () => {
    it('returns messages mapped to domain entities ordered by sentAt', async () => {
      m.order.mockResolvedValue({ data: [MSG_ROW], error: null });

      const result = await repo.getMessages(CONV_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(MSG_ID);
      expect(result[0].body).toBe('Hola atleta!');
      expect(result[0].readAt).toBeNull();
      expect(result[0].sentAt).toBeInstanceOf(Date);
    });

    it('returns empty array when there are no messages', async () => {
      m.order.mockResolvedValue({ data: [], error: null });

      const result = await repo.getMessages(CONV_ID);

      expect(result).toEqual([]);
    });

    it('maps read_at to a Date when message has been read', async () => {
      const readRow = { ...MSG_ROW, read_at: NOW_ISO };
      m.order.mockResolvedValue({ data: [readRow], error: null });

      const result = await repo.getMessages(CONV_ID);

      expect(result[0].readAt).toBeInstanceOf(Date);
    });

    it('throws when supabase returns an error', async () => {
      m.order.mockResolvedValue({ data: null, error: new Error('Query failed') });

      await expect(repo.getMessages(CONV_ID)).rejects.toThrow('Query failed');
    });
  });

  // ── sendMessage ──────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    const validInput: SendMessageInput = {
      conversationId: CONV_ID,
      senderId:       COACH_ID,
      body:           'Hola atleta!',
    };

    it('inserts and returns the new message', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: MSG_ROW, error: null });
      m.select.mockReturnValue({ ...m.chain, single: singleMock });
      m.insert.mockReturnValue({ select: m.select });

      const result = await repo.sendMessage(validInput);

      expect(result.id).toBe(MSG_ID);
      expect(result.body).toBe('Hola atleta!');
      expect(result.senderId).toBe(COACH_ID);
    });

    it('throws when supabase insert fails', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') });
      m.select.mockReturnValue({ ...m.chain, single: singleMock });
      m.insert.mockReturnValue({ select: m.select });

      await expect(repo.sendMessage(validInput)).rejects.toThrow('Insert failed');
    });
  });

  // ── markAsRead ───────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('updates read_at for all unread messages not sent by the user', async () => {
      m.is.mockResolvedValue({ error: null });

      await expect(repo.markAsRead(CONV_ID, COACH_ID)).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('messages');
    });

    it('throws when supabase update fails', async () => {
      m.is.mockResolvedValue({ error: new Error('Update failed') });

      await expect(repo.markAsRead(CONV_ID, COACH_ID)).rejects.toThrow('Update failed');
    });
  });

  // ── getUnreadCount ───────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns 0 when user has no conversations', async () => {
      m.or.mockResolvedValue({ data: [], error: null });

      const count = await repo.getUnreadCount(COACH_ID);

      expect(count).toBe(0);
    });

    it('returns the total unread count across all conversations', async () => {
      m.or.mockResolvedValue({ data: [{ id: CONV_ID }], error: null });
      m.is.mockResolvedValue({ count: 3, error: null });

      const count = await repo.getUnreadCount(COACH_ID);

      expect(count).toBe(3);
    });

    it('returns 0 when count is null', async () => {
      m.or.mockResolvedValue({ data: [{ id: CONV_ID }], error: null });
      m.is.mockResolvedValue({ count: null, error: null });

      const count = await repo.getUnreadCount(COACH_ID);

      expect(count).toBe(0);
    });

    it('throws when conversations query fails', async () => {
      m.or.mockResolvedValue({ data: null, error: new Error('Conv error') });

      await expect(repo.getUnreadCount(COACH_ID)).rejects.toThrow('Conv error');
    });
  });

  // ── getConversations ─────────────────────────────────────────────────────

  describe('getConversations', () => {
    const CONV_WITH_JOINS = {
      id: CONV_ID,
      coach_id: COACH_ID,
      athlete_id: ATHLETE_ID,
      created_at: NOW_ISO,
      coach: { id: COACH_ID, full_name: 'Coach Name' },
      athlete: { id: ATHLETE_ID, full_name: 'Athlete Name' },
    };

    it('returns empty array when user has no conversations', async () => {
      m.or.mockResolvedValue({ data: [], error: null });

      const result = await repo.getConversations(COACH_ID);

      expect(result).toEqual([]);
    });

    it('returns conversations with otherUserName for coach perspective', async () => {
      m.or.mockResolvedValue({ data: [CONV_WITH_JOINS], error: null });
      // last messages query
      m.order.mockResolvedValueOnce({ data: [{ conversation_id: CONV_ID, body: 'Hola!', sent_at: NOW_ISO }], error: null });
      // unread query
      m.is.mockResolvedValueOnce({ data: [], error: null });

      const result = await repo.getConversations(COACH_ID);

      expect(result).toHaveLength(1);
      expect(result[0].otherUserName).toBe('Athlete Name');
      expect(result[0].lastMessageBody).toBe('Hola!');
      expect(result[0].unreadCount).toBe(0);
    });

    it('returns conversations with otherUserName for athlete perspective', async () => {
      m.or.mockResolvedValue({ data: [CONV_WITH_JOINS], error: null });
      m.order.mockResolvedValueOnce({ data: [], error: null });
      m.is.mockResolvedValueOnce({ data: [], error: null });

      const result = await repo.getConversations(ATHLETE_ID);

      expect(result).toHaveLength(1);
      expect(result[0].otherUserName).toBe('Coach Name');
    });

    it('counts unread messages correctly', async () => {
      m.or.mockResolvedValue({ data: [CONV_WITH_JOINS], error: null });
      m.order.mockResolvedValueOnce({ data: [], error: null });
      m.is.mockResolvedValueOnce({
        data: [{ conversation_id: CONV_ID, id: 'msg-1' }, { conversation_id: CONV_ID, id: 'msg-2' }],
        error: null,
      });

      const result = await repo.getConversations(COACH_ID);

      expect(result[0].unreadCount).toBe(2);
    });

    it('throws when conversations query fails', async () => {
      m.or.mockResolvedValue({ data: null, error: new Error('DB error') });

      await expect(repo.getConversations(COACH_ID)).rejects.toThrow('DB error');
    });

    it('sorts conversations by lastMessageAt descending', async () => {
      const CONV_2 = { ...CONV_WITH_JOINS, id: 'conv-0002-0000-0000-0000-000000000000' };
      m.or.mockResolvedValue({ data: [CONV_WITH_JOINS, CONV_2], error: null });
      m.order.mockResolvedValueOnce({
        data: [
          { conversation_id: CONV_2.id, body: 'Newer', sent_at: '2025-02-01T10:00:00.000Z' },
          { conversation_id: CONV_ID, body: 'Older', sent_at: NOW_ISO },
        ],
        error: null,
      });
      m.is.mockResolvedValueOnce({ data: [], error: null });

      const result = await repo.getConversations(COACH_ID);

      expect(result[0].id).toBe(CONV_2.id);
    });

    it('sorts by createdAt when no lastMessageAt exists', async () => {
      m.or.mockResolvedValue({ data: [CONV_WITH_JOINS], error: null });
      m.order.mockResolvedValueOnce({ data: [], error: null });
      m.is.mockResolvedValueOnce({ data: [], error: null });
      const result = await repo.getConversations(COACH_ID);
      expect(result).toHaveLength(1);
    });
  });

  // ── branch coverage ───────────────────────────────────────────────────────

  describe('getOrCreateConversation (branch coverage)', () => {
    it('throws when insert returns no data and no error', async () => {
      m.maybeSingle.mockResolvedValue({ data: null, error: null });
      m.eq.mockReturnValue({
        ...m.chain,
        eq: jest.fn().mockReturnValue({ ...m.chain, maybeSingle: m.maybeSingle }),
      });
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      m.select.mockReturnValue({ ...m.chain, single: singleMock });
      m.insert.mockReturnValue({ select: m.select });
      await expect(repo.getOrCreateConversation(COACH_ID, ATHLETE_ID)).rejects.toThrow('Failed to create conversation');
    });
  });

  describe('getMessages (branch coverage)', () => {
    it('handles null data gracefully', async () => {
      m.order.mockResolvedValue({ data: null, error: null });
      expect(await repo.getMessages(CONV_ID)).toEqual([]);
    });
  });

  describe('sendMessage (branch coverage)', () => {
    it('throws when insert returns null data with no error', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      m.select.mockReturnValue({ ...m.chain, single: singleMock });
      m.insert.mockReturnValue({ select: m.select });
      await expect(repo.sendMessage({ conversationId: CONV_ID, senderId: COACH_ID, body: 'Hi' }))
        .rejects.toThrow('Failed to send message');
    });
  });

  describe('getUnreadCount (branch coverage)', () => {
    it('returns 0 when convRows is null', async () => {
      m.or.mockResolvedValue({ data: null, error: null });
      expect(await repo.getUnreadCount(COACH_ID)).toBe(0);
    });

    it('throws when unread count query fails', async () => {
      m.or.mockResolvedValue({ data: [{ id: CONV_ID }], error: null });
      m.is.mockResolvedValue({ count: null, error: { message: 'Count failed' } });
      await expect(repo.getUnreadCount(COACH_ID)).rejects.toMatchObject({ message: 'Count failed' });
    });
  });

});
