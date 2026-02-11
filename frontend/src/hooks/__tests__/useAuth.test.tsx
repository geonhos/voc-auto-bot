import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useAuthStore } from '@/store/authStore';

import { useRefreshToken } from '../useAuth';


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

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  describe('useRefreshToken', () => {
    it('should call refresh endpoint (cookie-based)', async () => {
      const apiModule = await import('@/lib/api/client');
      const api = apiModule.api as jest.Mocked<typeof apiModule.api>;
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: null,
      });

      const { result } = renderHook(() => useRefreshToken(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(api.post).toHaveBeenCalledWith('/auth/refresh');
    });
  });
});
