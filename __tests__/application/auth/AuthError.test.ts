import { mapSupabaseAuthError, AuthError } from '../../../src/application/auth/AuthError';

describe('mapSupabaseAuthError', () => {
  it('maps invalid login credentials to INVALID_CREDENTIALS', () => {
    const error = mapSupabaseAuthError({ message: 'Invalid login credentials' });
    expect(error.code).toBe('INVALID_CREDENTIALS');
  });

  it('maps already registered message to EMAIL_ALREADY_IN_USE', () => {
    const error = mapSupabaseAuthError({ message: 'User already registered' });
    expect(error.code).toBe('EMAIL_ALREADY_IN_USE');
  });

  it('maps fetch failure to NETWORK_ERROR', () => {
    const error = mapSupabaseAuthError({ message: 'Failed to fetch' });
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('maps email_not_confirmed to EMAIL_NOT_CONFIRMED', () => {
    const error = mapSupabaseAuthError({ message: 'email_not_confirmed' });
    expect(error.code).toBe('EMAIL_NOT_CONFIRMED');
  });

  it('maps "email not confirmed" variant to EMAIL_NOT_CONFIRMED', () => {
    const error = mapSupabaseAuthError({ message: 'Email not confirmed' });
    expect(error.code).toBe('EMAIL_NOT_CONFIRMED');
  });

  it('EMAIL_NOT_CONFIRMED message explains confirmation requirement', () => {
    const error = mapSupabaseAuthError({ message: 'email_not_confirmed' });
    expect(error.message).toContain('confirmar');
  });

  it('maps unknown messages to UNKNOWN_ERROR', () => {
    const error = mapSupabaseAuthError({ message: 'Something weird happened' });
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('returns an instance of AuthError', () => {
    const error = mapSupabaseAuthError({ message: 'Any error' });
    expect(error).toBeInstanceOf(AuthError);
  });
});
