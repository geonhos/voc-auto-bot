import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVocStatusLookup } from '../useVocStatus';
import { api } from '@/lib/api/client';

jest.mock('@/lib/api/client');

const mockApi = api as jest.Mocked<typeof api>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useVocStatusLookup', () => {
  it('should successfully lookup VOC status', async () => {
    const mockResponse = {
      ticketId: 'VOC-20260123-00001',
      title: '테스트 VOC',
      content: '테스트 내용',
      status: 'IN_PROGRESS' as const,
      statusLabel: '처리중',
      category: '오류/버그',
      priority: 'HIGH' as const,
      createdAt: '2026-01-23T14:30:25Z',
      updatedAt: '2026-01-23T14:45:30Z',
      statusHistory: [],
    };

    mockApi.post.mockResolvedValueOnce({ success: true, data: mockResponse });

    const { result } = renderHook(() => useVocStatusLookup(), { wrapper: createWrapper() });

    result.current.mutate({
      ticketId: 'VOC-20260123-00001',
      customerEmail: 'test@example.com',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should handle lookup failure', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useVocStatusLookup(), { wrapper: createWrapper() });

    result.current.mutate({
      ticketId: 'VOC-20260123-99999',
      customerEmail: 'test@example.com',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
