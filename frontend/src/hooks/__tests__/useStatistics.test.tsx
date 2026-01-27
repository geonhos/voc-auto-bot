import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useDashboardData,
  useKpi,
  useTrend,
  useCategoryStats,
  usePriorityStats,
  useRecentVocs,
} from '../useStatistics';
import { statisticsApi } from '@/lib/api/statisticsApi';

jest.mock('@/lib/api/statisticsApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useStatistics hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useDashboardData', () => {
    it('fetches dashboard data successfully', async () => {
      const mockData = {
        kpi: {
          totalVocs: 1000,
          resolvedVocs: 800,
          pendingVocs: 200,
          avgResolutionTimeHours: 24.5,
          resolutionRate: 80.0,
          todayVocs: 50,
          weekVocs: 300,
          monthVocs: 1000,
        },
        trend: [],
        categoryStats: [],
        statusDistribution: [],
        channelStats: [],
        priorityStats: [],
        topAssignees: [],
      };

      (statisticsApi.getDashboard as jest.Mock).mockResolvedValue(mockData);

      const { result } = renderHook(() => useDashboardData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockData);
      expect(statisticsApi.getDashboard).toHaveBeenCalledWith(undefined);
    });

    it('passes params to API call', async () => {
      const params = { fromDate: '2024-01-01', toDate: '2024-01-31' };

      (statisticsApi.getDashboard as jest.Mock).mockResolvedValue({});

      renderHook(() => useDashboardData(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(statisticsApi.getDashboard).toHaveBeenCalledWith(params);
      });
    });
  });

  describe('useKpi', () => {
    it('fetches KPI data successfully', async () => {
      const mockKpiData = {
        totalVocs: 1000,
        resolvedVocs: 800,
        pendingVocs: 200,
        avgResolutionTimeHours: 24.5,
        resolutionRate: 80.0,
        todayVocs: 50,
        weekVocs: 300,
        monthVocs: 1000,
      };

      (statisticsApi.getKpi as jest.Mock).mockResolvedValue(mockKpiData);

      const { result } = renderHook(() => useKpi(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockKpiData);
    });
  });

  describe('useTrend', () => {
    it('fetches trend data for specified period', async () => {
      const mockTrendData = [
        { date: '2024-01-01', received: 10, resolved: 8, pending: 2 },
        { date: '2024-01-02', received: 15, resolved: 12, pending: 3 },
      ];

      (statisticsApi.getTrend as jest.Mock).mockResolvedValue(mockTrendData);

      const { result } = renderHook(() => useTrend('week'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTrendData);
    });
  });

  describe('useCategoryStats', () => {
    it('fetches category statistics', async () => {
      const mockCategoryData = [
        {
          categoryId: 1,
          categoryName: '제품 문의',
          count: 100,
          percentage: 40.0,
        },
        {
          categoryId: 2,
          categoryName: '배송 문의',
          count: 80,
          percentage: 32.0,
        },
      ];

      (statisticsApi.getCategoryStats as jest.Mock).mockResolvedValue(mockCategoryData);

      const { result } = renderHook(() => useCategoryStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCategoryData);
    });
  });

  describe('usePriorityStats', () => {
    it('fetches priority statistics', async () => {
      const mockPriorityData = [
        {
          priority: 'URGENT',
          priorityLabel: '긴급',
          count: 25,
          percentage: 10.5,
        },
        {
          priority: 'HIGH',
          priorityLabel: '높음',
          count: 80,
          percentage: 33.6,
        },
      ];

      (statisticsApi.getPriorityStats as jest.Mock).mockResolvedValue(mockPriorityData);

      const { result } = renderHook(() => usePriorityStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPriorityData);
    });
  });

  describe('useRecentVocs', () => {
    it('fetches recent VOCs with default limit', async () => {
      const mockVocs = [
        {
          id: 1,
          ticketId: 'VOC-001',
          title: 'Test VOC',
          content: 'Test content',
          status: 'RECEIVED' as const,
          priority: 'HIGH' as const,
          channel: 'EMAIL' as const,
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          attachments: [],
          memos: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ];

      (statisticsApi.getRecentVocs as jest.Mock).mockResolvedValue(mockVocs);

      const { result } = renderHook(() => useRecentVocs(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockVocs);
      expect(statisticsApi.getRecentVocs).toHaveBeenCalledWith(10);
    });

    it('fetches recent VOCs with custom limit', async () => {
      (statisticsApi.getRecentVocs as jest.Mock).mockResolvedValue([]);

      renderHook(() => useRecentVocs(5), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(statisticsApi.getRecentVocs).toHaveBeenCalledWith(5);
      });
    });
  });
});
