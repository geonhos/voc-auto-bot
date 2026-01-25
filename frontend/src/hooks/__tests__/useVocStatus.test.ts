import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVocStatusLookup } from '../useVocStatus';
import { api } from '@/lib/api/client';
import type { VocStatusDetail } from '@/types';

jest.mock('@/lib/api/client');

const mockApi = api as jest.Mocked<typeof api>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useVocStatusLookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully lookup VOC status', async () => {
    const mockResponse: VocStatusDetail = {
      ticketId: 'VOC-20260123-00001',
      title: '테스트 VOC',
      content: '테스트 내용',
      status: 'IN_PROGRESS',
      statusLabel: '처리중',
      category: '오류/버그',
      priority: 'HIGH',
      createdAt: '2026-01-23T14:30:25Z',
      updatedAt: '2026-01-23T14:45:30Z',
      statusHistory: [
        {
          id: 1,
          status: 'RECEIVED',
          statusLabel: '접수',
          createdAt: '2026-01-23T14:30:25Z',
        },
        {
          id: 2,
          status: 'IN_PROGRESS',
          statusLabel: '처리중',
          createdAt: '2026-01-23T14:45:30Z',
        },
      ],
    };

    mockApi.post.mockResolvedValueOnce({ success: true, data: mockResponse });

    const { result } = renderHook(() => useVocStatusLookup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      ticketId: 'VOC-20260123-00001',
      customerEmail: 'test@example.com',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(mockApi.post).toHaveBeenCalledWith('/vocs/public/status', {
      ticketId: 'VOC-20260123-00001',
      customerEmail: 'test@example.com',
    });
  });

  it('should handle lookup failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useVocStatusLookup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      ticketId: 'VOC-20260123-99999',
      customerEmail: 'test@example.com',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });
});
