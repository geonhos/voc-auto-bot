import type {
  DashboardData,
  KpiData,
  TrendData,
  CategoryStats,
  PriorityStats,
  StatisticsParams,
} from '@/types/statistics';
import type { Voc } from '@/types/voc';

import { api } from './client';

export interface SentimentStats {
  positive: number;
  negative: number;
  neutral: number;
  [key: string]: number;
}

export const statisticsApi = {
  /**
   * Fetch complete dashboard data including KPI, trends, and distributions
   */
  getDashboard: async (params?: StatisticsParams): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/statistics/dashboard', params);
    return response.data;
  },

  /**
   * Fetch KPI metrics only
   */
  getKpi: async (params?: StatisticsParams): Promise<KpiData> => {
    const response = await api.get<KpiData>('/statistics/kpi', params);
    return response.data;
  },

  /**
   * Fetch trend data for a specific period
   */
  getTrend: async (params?: StatisticsParams): Promise<TrendData[]> => {
    const response = await api.get<TrendData[]>('/statistics/trend', params);
    return response.data;
  },

  /**
   * Fetch category distribution statistics
   */
  getCategoryStats: async (params?: StatisticsParams): Promise<CategoryStats[]> => {
    const response = await api.get<CategoryStats[]>('/statistics/category', params);
    return response.data;
  },

  /**
   * Fetch priority distribution statistics
   */
  getPriorityStats: async (params?: StatisticsParams): Promise<PriorityStats[]> => {
    const response = await api.get<PriorityStats[]>('/statistics/priority', params);
    return response.data;
  },

  /**
   * Fetch recent VOCs
   */
  getRecentVocs: async (limit = 10): Promise<Voc[]> => {
    const response = await api.get<Voc[]>('/statistics/recent-vocs', { limit });
    return response.data;
  },

  /**
   * Fetch sentiment distribution statistics
   */
  getSentimentStats: async (): Promise<SentimentStats> => {
    const response = await api.get<SentimentStats>('/statistics/sentiment');
    return response.data;
  },
};
