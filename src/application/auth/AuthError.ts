export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_IN_USE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function mapSupabaseAuthError(error: { message: string; status?: number }): AuthError {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return new AuthError('INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  if (message.includes('user already registered') || message.includes('already been registered')) {
    return new AuthError('EMAIL_ALREADY_IN_USE', 'An account with this email already exists.');
  }

  if (message.includes('network') || message.includes('fetch')) {
    return new AuthError('NETWORK_ERROR', 'No internet connection. Please try again.');
  }

  return new AuthError('UNKNOWN_ERROR', 'An unexpected error occurred. Please try again.');
}
