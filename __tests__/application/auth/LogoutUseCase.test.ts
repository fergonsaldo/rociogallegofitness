import { logoutUseCase } from '../../../src/application/auth/LogoutUseCase';

jest.mock('../../../src/infrastructure/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { supabase } = require('../../../src/infrastructure/supabase/client');

beforeEach(() => jest.clearAllMocks());

describe('logoutUseCase', () => {
  it('resolves without error when signOut succeeds', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });
    await expect(logoutUseCase()).resolves.toBeUndefined();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('throws AuthError when signOut returns an error', async () => {
    supabase.auth.signOut.mockResolvedValue({
      error: { message: 'Session not found', status: 401 },
    });
    await expect(logoutUseCase()).rejects.toThrow();
  });
});
