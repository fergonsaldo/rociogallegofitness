/**
 * Tests de validación de cambio de contraseña — RF-E2-11
 */

import { validatePasswordChange } from '../../../app/(coach)/clients/[id]';
import { Strings } from '../../../src/shared/constants/strings';

describe('validatePasswordChange', () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  it('returns null when passwords match and meet minimum length', () => {
    expect(validatePasswordChange('password1', 'password1')).toBeNull();
  });

  it('returns null for exactly 8 characters', () => {
    expect(validatePasswordChange('abcd1234', 'abcd1234')).toBeNull();
  });

  it('returns null for passwords longer than 8 characters', () => {
    expect(validatePasswordChange('averylongpassword!', 'averylongpassword!')).toBeNull();
  });

  // ── Too short ───────────────────────────────────────────────────────────────

  it('returns too-short error when password has 7 characters', () => {
    expect(validatePasswordChange('abc1234', 'abc1234')).toBe(Strings.changePasswordErrorTooShort);
  });

  it('returns too-short error when password is empty', () => {
    expect(validatePasswordChange('', '')).toBe(Strings.changePasswordErrorTooShort);
  });

  it('returns too-short error when password has 1 character', () => {
    expect(validatePasswordChange('a', 'a')).toBe(Strings.changePasswordErrorTooShort);
  });

  it('prioritizes too-short error over mismatch when password is short and does not match', () => {
    expect(validatePasswordChange('short', 'different')).toBe(Strings.changePasswordErrorTooShort);
  });

  // ── Mismatch ────────────────────────────────────────────────────────────────

  it('returns mismatch error when passwords differ', () => {
    expect(validatePasswordChange('password1', 'password2')).toBe(Strings.changePasswordErrorMismatch);
  });

  it('returns mismatch error when confirm is empty and new is long enough', () => {
    expect(validatePasswordChange('password1', '')).toBe(Strings.changePasswordErrorMismatch);
  });

  it('returns mismatch error when passwords differ only in case', () => {
    expect(validatePasswordChange('Password1', 'password1')).toBe(Strings.changePasswordErrorMismatch);
  });

  it('returns mismatch error when confirm has trailing space', () => {
    expect(validatePasswordChange('password1', 'password1 ')).toBe(Strings.changePasswordErrorMismatch);
  });
});
