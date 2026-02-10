import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';

import { useDashboardViewModel } from '../useDashboardViewModel';
import { useDashboardData } from '../useStatistics';

jest.mock('../useStatistics');

const mockDashboardData = {
  kpi: {
    totalVocs: 1234,
    resolvedVocs: 678,
    pendingVocs: 234,
    avgResolutionTimeHours: 2.3,
    resolutionRate: 54.9,
    todayVocs: 58,
    weekVocs: 386,
    monthVocs: 1234,
  },
  trend: [
    { date: '2024-01-01', received: 50, resolved: 45, pending: 5 },
  ],
  categoryStats: [],
  statusDistribution: [],
  channelStats: [],
  priorityStats: [],
  topAssignees: [],
};

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

function setupMocks({
  data = mockDashboardData,
  isLoading = false,
  isError = false,
  error = null as Error | null,
  refetch = jest.fn(),
} = {}) {
  (useDashboardData as jest.Mock).mockReturnValue({
    data,
    isLoading,
    isError,
    error,
    refetch,
  });
}

describe('useDashboardViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have default period of 7days', () => {
    setupMocks();

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.period).toBe('7days');
  });

  it('should return dashboard data from useDashboardData', () => {
    setupMocks();

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(mockDashboardData);
  });

  it('should expose loading state', () => {
    setupMocks({ isLoading: true, data: undefined });

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should expose error state', () => {
    const error = new Error('Failed to fetch dashboard');
    setupMocks({ isError: true, error, data: undefined });

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(error);
  });

  it('should change period with setPeriod', () => {
    setupMocks();

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setPeriod('today');
    });

    expect(result.current.period).toBe('today');
  });

  it('should set custom date range and switch to custom period', () => {
    setupMocks();

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setCustomDateRange('2024-01-01', '2024-01-31');
    });

    expect(result.current.period).toBe('custom');
    expect(result.current.customDateRange).toEqual({
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
    });
  });

  it('should generate dateRangeLabel from params', () => {
    setupMocks();

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    // Default period is 7days, so there should be a date range label
    expect(result.current.dateRangeLabel).toMatch(/\d{4}\.\d{2}\.\d{2} - \d{4}\.\d{2}\.\d{2}/);
  });

  it('should call refetch from useDashboardData', () => {
    const mockRefetch = jest.fn();
    setupMocks({ refetch: mockRefetch });

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should pass correct params for 30days period', () => {
    setupMocks();

    const { result } = renderHook(() => useDashboardViewModel(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setPeriod('30days');
    });

    // useDashboardData should have been called with params containing fromDate and toDate
    const lastCall = (useDashboardData as jest.Mock).mock.calls.at(-1);
    const params = lastCall?.[0];
    expect(params).toHaveProperty('fromDate');
    expect(params).toHaveProperty('toDate');
  });
});
