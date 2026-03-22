import { loginUseCase } from '../../../src/application/auth/LoginUseCase';
import { AuthError } from '../../../src/application/auth/AuthError';

// ── Mock Supabase client ──────────────────────────────────────────────────────
const mockSignInWithPassword = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('../../../src/infrastructure/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
    }),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const VALID_AUTH_USER = { id: '123e4567-e89b-12d3-a456-426614174000' };
const VALID_PROFILE = {
  id: VALID_AUTH_USER.id,
  email: 'coach@example.com',
  full_name: 'John Doe',
  role: 'coach',
  weight_unit: 'kg',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('loginUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a user with correct profile on valid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: VALID_AUTH_USER }, error: null });
    mockSingle.mockResolvedValue({ data: VALID_PROFILE, error: null });

    const result = await loginUseCase({ email: 'coach@example.com', password: 'password123' });

    expect(result.user.email).toBe('coach@example.com');
    expect(result.user.role).toBe('coach');
    expect(result.user.fullName).toBe('John Doe');
  });

  it('throws AuthError with INVALID_CREDENTIALS on wrong password', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      loginUseCase({ email: 'coach@example.com', password: 'wrong' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('throws AuthError with NETWORK_ERROR on fetch failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Failed to fetch' },
    });

    await expect(
      loginUseCase({ email: 'coach@example.com', password: 'password123' })
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('throws a Zod validation error when email is invalid', async () => {
    await expect(
      loginUseCase({ email: 'not-an-email', password: 'password123' })
    ).rejects.toThrow();

    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('throws a Zod validation error when password is empty', async () => {
    await expect(
      loginUseCase({ email: 'coach@example.com', password: '' })
    ).rejects.toThrow();

    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('throws AuthError when profile fetch fails after successful auth', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: VALID_AUTH_USER }, error: null });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Row not found' } });

    await expect(
      loginUseCase({ email: 'coach@example.com', password: 'password123' })
    ).rejects.toBeInstanceOf(AuthError);
  });

  it('throws AuthError when auth returns no user and no error', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: null });
    await expect(
      loginUseCase({ email: 'coach@example.com', password: 'password123' })
    ).rejects.toBeInstanceOf(AuthError);
  });

  it('throws AuthError when profile is null with no error', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: VALID_AUTH_USER }, error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    await expect(
      loginUseCase({ email: 'coach@example.com', password: 'password123' })
    ).rejects.toBeInstanceOf(AuthError);
  });
});
