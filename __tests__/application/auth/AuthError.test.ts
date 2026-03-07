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

  it('maps unknown messages to UNKNOWN_ERROR', () => {
    const error = mapSupabaseAuthError({ message: 'Something weird happened' });
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  it('returns an instance of AuthError', () => {
    const error = mapSupabaseAuthError({ message: 'Any error' });
    expect(error).toBeInstanceOf(AuthError);
  });
});
