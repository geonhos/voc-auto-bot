'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { DashboardData, StatisticsParams } from '@/types/statistics';

const STATISTICS_QUERY_KEY = 'statistics';

export function useDashboardData(params?: StatisticsParams) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'dashboard', params],
    queryFn: async () => {
      const response = await api.get<DashboardData>(
        '/statistics/dashboard',
        params as Record<string, unknown>
      );
      return response.data;
    },
  });
}
