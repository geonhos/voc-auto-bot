import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useAuthStore } from '@/store/authStore';

import { useTokenStatus, useRefreshToken } from '../useAuth';


// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  api: {
    post: jest.fn(),
  },
}));

// Helper to create wrapper with React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

// Helper to create mock token
function createMockToken(expiryMinutes: number): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiryMinutes * 60;
  const payload = JSON.stringify({ exp, sub: 'test-user' });
  const encodedPayload = btoa(payload);
  return `header.${encodedPayload}.signature`;
}

describe('useAuth', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.getState().logout();
  });

  describe('useTokenStatus', () => {
    it('should return expired status when no token', () => {
      const { result } = renderHook(() => useTokenStatus());

      expect(result.current.isExpired).toBe(true);
      expect(result.current.isExpiring).toBe(true);
      expect(result.current.remainingMinutes).toBe(0);
    });

    it('should return valid status for fresh token', () => {
      const token = createMockToken(30);
      useAuthStore.getState().setTokens(token, 'refresh-token');

      const { result } = renderHook(() => useTokenStatus());

      expect(result.current.isExpired).toBe(false);
      expect(result.current.isExpiring).toBe(false);
      expect(result.current.remainingMinutes).toBeGreaterThan(25);
    });

    it('should return expiring status when token expires soon', () => {
      const token = createMockToken(3);
      useAuthStore.getState().setTokens(token, 'refresh-token');

      const { result } = renderHook(() => useTokenStatus());

      expect(result.current.isExpired).toBe(false);
      expect(result.current.isExpiring).toBe(true);
      expect(result.current.remainingMinutes).toBeLessThanOrEqual(3);
    });

    it('should return expired status for past token', () => {
      const token = createMockToken(-5);
      useAuthStore.getState().setTokens(token, 'refresh-token');

      const { result } = renderHook(() => useTokenStatus());

      expect(result.current.isExpired).toBe(true);
      expect(result.current.isExpiring).toBe(true);
      expect(result.current.remainingMinutes).toBe(0);
    });
  });

  describe('useRefreshToken', () => {
    it('should throw error when no refresh token', async () => {
      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toEqual(new Error('No refresh token'));
      });
    });

    it('should update tokens on successful refresh', async () => {
      const apiModule = await import('@/lib/api/client');
      const api = apiModule.api as jest.Mocked<typeof apiModule.api>;
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      useAuthStore.getState().setTokens('old-access-token', 'old-refresh-token');

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const { accessToken, refreshToken } = useAuthStore.getState();
      expect(accessToken).toBe('new-access-token');
      expect(refreshToken).toBe('new-refresh-token');
    });
  });
});
