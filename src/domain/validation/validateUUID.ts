const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the value is a valid UUID (any version).
 */
export function validateUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}
