'use client';

import { useQuery } from '@tanstack/react-query';

import { statisticsApi } from '@/lib/api/statisticsApi';
import type { StatisticsParams } from '@/types/statistics';

const STATISTICS_QUERY_KEY = 'statistics';

/**
 * @description Fetch complete dashboard data including KPI, trends, and all distributions
 */
export function useDashboardData(params?: StatisticsParams) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'dashboard', params],
    queryFn: () => statisticsApi.getDashboard(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * @description Fetch KPI metrics only
 */
export function useKpi(params?: StatisticsParams) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'kpi', params],
    queryFn: () => statisticsApi.getKpi(params),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * @description Fetch trend data for the specified period
 */
export function useTrend(period: 'day' | 'week' | 'month', params?: StatisticsParams) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'trend', period, params],
    queryFn: () => statisticsApi.getTrend(params),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * @description Fetch category distribution statistics
 */
export function useCategoryStats(params?: StatisticsParams) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'category', params],
    queryFn: () => statisticsApi.getCategoryStats(params),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * @description Fetch priority distribution statistics
 */
export function usePriorityStats(params?: StatisticsParams) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'priority', params],
    queryFn: () => statisticsApi.getPriorityStats(params),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * @description Fetch recent VOCs list
 */
export function useRecentVocs(limit = 10) {
  return useQuery({
    queryKey: [STATISTICS_QUERY_KEY, 'recent-vocs', limit],
    queryFn: () => statisticsApi.getRecentVocs(limit),
    staleTime: 1000 * 60, // 1 minute
  });
}
