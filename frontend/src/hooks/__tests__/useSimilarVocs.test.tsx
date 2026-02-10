import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

import { api } from '@/lib/api/client';
import type { SimilarVoc } from '@/types';

import { useSimilarVocs } from '../useSimilarVocs';

jest.mock('@/lib/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockSimilarVocs: SimilarVoc[] = [
  {
    id: 2,
    ticketId: 'VOC-2024-0002',
    title: '환불 요청',
    status: 'IN_PROGRESS',
    similarity: 0.85,
    createdAt: '2024-01-14T09:00:00Z',
  },
  {
    id: 3,
    ticketId: 'VOC-2024-0003',
    title: '배송 지연 문의',
    status: 'NEW',
    similarity: 0.72,
    createdAt: '2024-01-13T08:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useSimilarVocs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch similar VOCs successfully', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockSimilarVocs });

    const { result } = renderHook(() => useSimilarVocs(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSimilarVocs);
    expect(api.get).toHaveBeenCalledWith('/vocs/1/similar', {});
  });

  it('should pass limit and minSimilarity params', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockSimilarVocs });

    const { result } = renderHook(
      () => useSimilarVocs(1, { limit: 5, minSimilarity: 0.5 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/vocs/1/similar', {
      limit: 5,
      minSimilarity: 0.5,
    });
  });

  it('should not fetch when enabled is false', () => {
    const { result } = renderHook(
      () => useSimilarVocs(1, { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should not fetch when vocId is 0', () => {
    const { result } = renderHook(
      () => useSimilarVocs(0),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should return empty array on empty result', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useSimilarVocs(99), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('should handle API error', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSimilarVocs(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });
});
