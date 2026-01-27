/**
 * @description Token utility functions for JWT token management
 */

interface TokenPayload {
  exp?: number;
  iat?: number;
  sub?: string;
}

/**
 * Decode JWT token payload without verification
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded as TokenPayload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param token JWT token string
 * @returns true if token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

/**
 * Check if token is expiring soon (within specified minutes)
 * @param token JWT token string
 * @param minutesBeforeExpiry Minutes before expiration to consider as "expiring soon"
 * @returns true if token will expire within specified minutes
 */
export function isTokenExpiring(token: string, minutesBeforeExpiry: number = 5): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const expiryTime = payload.exp * 1000;
  const now = Date.now();
  const warningTime = minutesBeforeExpiry * 60 * 1000;

  return expiryTime - now < warningTime;
}

/**
 * Get token expiry time in milliseconds
 * @param token JWT token string
 * @returns Expiry timestamp in milliseconds or null if invalid
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return payload.exp * 1000;
}

/**
 * Get remaining time until token expiry in minutes
 * @param token JWT token string
 * @returns Minutes until expiry or 0 if expired/invalid
 */
export function getTokenRemainingMinutes(token: string): number {
  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) {
    return 0;
  }

  const remaining = expiryTime - Date.now();
  return Math.max(0, Math.floor(remaining / 60000));
}
