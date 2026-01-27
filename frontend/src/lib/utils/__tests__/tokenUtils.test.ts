import {
  decodeToken,
  isTokenExpired,
  isTokenExpiring,
  getTokenExpiry,
  getTokenRemainingMinutes,
} from '../tokenUtils';

describe('tokenUtils', () => {
  // Mock token with expiry in 10 minutes
  const createMockToken = (expiryMinutes: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + expiryMinutes * 60;
    const payload = JSON.stringify({ exp, sub: 'test-user' });
    const encodedPayload = btoa(payload);
    return `header.${encodedPayload}.signature`;
  };

  describe('decodeToken', () => {
    it('should decode valid token', () => {
      const token = createMockToken(10);
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('test-user');
      expect(decoded?.exp).toBeGreaterThan(0);
    });

    it('should return null for invalid token format', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = decodeToken('header.invalid-base64.signature');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = createMockToken(10);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token = createMockToken(-5);
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });

    it('should return true for token without expiry', () => {
      const payload = JSON.stringify({ sub: 'test-user' });
      const encodedPayload = btoa(payload);
      const token = `header.${encodedPayload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });
  });

  describe('isTokenExpiring', () => {
    it('should return false when token has more than 5 minutes', () => {
      const token = createMockToken(10);
      expect(isTokenExpiring(token, 5)).toBe(false);
    });

    it('should return true when token expires within 5 minutes', () => {
      const token = createMockToken(3);
      expect(isTokenExpiring(token, 5)).toBe(true);
    });

    it('should return true for expired token', () => {
      const token = createMockToken(-5);
      expect(isTokenExpiring(token, 5)).toBe(true);
    });

    it('should use custom expiry threshold', () => {
      const token = createMockToken(8);
      expect(isTokenExpiring(token, 5)).toBe(false);
      expect(isTokenExpiring(token, 10)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpiring('invalid-token', 5)).toBe(true);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return expiry timestamp', () => {
      const token = createMockToken(10);
      const expiry = getTokenExpiry(token);

      expect(expiry).not.toBeNull();
      expect(expiry).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiry('invalid-token')).toBeNull();
    });

    it('should return null for token without expiry', () => {
      const payload = JSON.stringify({ sub: 'test-user' });
      const encodedPayload = btoa(payload);
      const token = `header.${encodedPayload}.signature`;

      expect(getTokenExpiry(token)).toBeNull();
    });
  });

  describe('getTokenRemainingMinutes', () => {
    it('should return correct remaining minutes', () => {
      const token = createMockToken(10);
      const remaining = getTokenRemainingMinutes(token);

      // Allow for small timing differences
      expect(remaining).toBeGreaterThanOrEqual(9);
      expect(remaining).toBeLessThanOrEqual(10);
    });

    it('should return 0 for expired token', () => {
      const token = createMockToken(-5);
      expect(getTokenRemainingMinutes(token)).toBe(0);
    });

    it('should return 0 for invalid token', () => {
      expect(getTokenRemainingMinutes('invalid-token')).toBe(0);
    });

    it('should round down to nearest minute', () => {
      const token = createMockToken(5.9);
      const remaining = getTokenRemainingMinutes(token);
      expect(remaining).toBe(5);
    });
  });
});
