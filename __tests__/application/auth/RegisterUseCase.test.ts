import { registerUseCase } from '../../../src/application/auth/RegisterUseCase';
import { AuthError } from '../../../src/application/auth/AuthError';

// ── Mock Supabase client ──────────────────────────────────────────────────────
const mockSignUp = jest.fn();
const mockInsertSingle = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock('../../../src/infrastructure/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      admin: {
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
    from: () => ({
      insert: () => ({
        select: () => ({ single: mockInsertSingle }),
      }),
    }),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const VALID_INPUT = {
  email: 'athlete@example.com',
  password: 'securePassword1',
  fullName: 'Jane Smith',
  role: 'athlete' as const,
};

const VALID_AUTH_USER = { id: '123e4567-e89b-12d3-a456-426614174001' };
const VALID_PROFILE = {
  id: VALID_AUTH_USER.id,
  email: VALID_INPUT.email,
  full_name: VALID_INPUT.fullName,
  role: 'athlete',
  weight_unit: 'kg',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('registerUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a user with the correct role after successful registration', async () => {
    mockSignUp.mockResolvedValue({ data: { user: VALID_AUTH_USER }, error: null });
    mockInsertSingle.mockResolvedValue({ data: VALID_PROFILE, error: null });

    const result = await registerUseCase(VALID_INPUT);

    expect(result.user.role).toBe('athlete');
    expect(result.user.email).toBe(VALID_INPUT.email);
    expect(result.user.fullName).toBe(VALID_INPUT.fullName);
  });

  it('throws AuthError with EMAIL_ALREADY_IN_USE when email is taken', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    await expect(registerUseCase(VALID_INPUT)).rejects.toMatchObject({
      code: 'EMAIL_ALREADY_IN_USE',
    });
  });

  it('rolls back auth user when profile insert fails', async () => {
    mockSignUp.mockResolvedValue({ data: { user: VALID_AUTH_USER }, error: null });
    mockInsertSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
    mockDeleteUser.mockResolvedValue({});

    await expect(registerUseCase(VALID_INPUT)).rejects.toBeInstanceOf(AuthError);
    expect(mockDeleteUser).toHaveBeenCalledWith(VALID_AUTH_USER.id);
  });

  it('throws a validation error when password is shorter than 8 characters', async () => {
    await expect(
      registerUseCase({ ...VALID_INPUT, password: 'short' })
    ).rejects.toThrow('Password must be at least 8 characters');

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('throws a validation error when role is not coach or athlete', async () => {
    await expect(
      registerUseCase({ ...VALID_INPUT, role: 'admin' as never })
    ).rejects.toThrow();

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('throws a validation error when full name is empty', async () => {
    await expect(
      registerUseCase({ ...VALID_INPUT, fullName: '' })
    ).rejects.toThrow('Full name is required');

    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
