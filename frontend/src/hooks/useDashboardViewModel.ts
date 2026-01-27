'use client';

import { useState, useMemo } from 'react';
import { useDashboardData } from './useStatistics';
import type { StatisticsParams } from '@/types/statistics';

export type PeriodType = 'today' | '7days' | '30days' | 'custom';

export interface UseDashboardViewModelReturn {
  period: PeriodType;
  customDateRange: { fromDate?: string; toDate?: string };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: ReturnType<typeof useDashboardData>['data'];
  setPeriod: (period: PeriodType) => void;
  setCustomDateRange: (fromDate: string, toDate: string) => void;
  refetch: () => void;
  dateRangeLabel: string;
}

export function useDashboardViewModel(): UseDashboardViewModelReturn {
  const [period, setPeriod] = useState<PeriodType>('7days');
  const [customDateRange, setCustomDateRangeState] = useState<{
    fromDate?: string;
    toDate?: string;
  }>({});

  const params = useMemo<StatisticsParams>(() => {
    const now = new Date();
    let fromDate: string | undefined;
    let toDate: string | undefined;

    switch (period) {
      case 'today':
        fromDate = now.toISOString().split('T')[0];
        toDate = fromDate;
        break;
      case '7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        fromDate = sevenDaysAgo.toISOString().split('T')[0];
        toDate = now.toISOString().split('T')[0];
        break;
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 29);
        fromDate = thirtyDaysAgo.toISOString().split('T')[0];
        toDate = now.toISOString().split('T')[0];
        break;
      case 'custom':
        fromDate = customDateRange.fromDate;
        toDate = customDateRange.toDate;
        break;
    }

    return { fromDate, toDate };
  }, [period, customDateRange]);

  const { data, isLoading, isError, error, refetch } = useDashboardData(params);

  const dateRangeLabel = useMemo(() => {
    if (!params.fromDate || !params.toDate) return '';
    const from = new Date(params.fromDate);
    const to = new Date(params.toDate);
    return `${from.getFullYear()}.${String(from.getMonth() + 1).padStart(2, '0')}.${String(from.getDate()).padStart(2, '0')} - ${to.getFullYear()}.${String(to.getMonth() + 1).padStart(2, '0')}.${String(to.getDate()).padStart(2, '0')}`;
  }, [params]);

  const setCustomDateRange = (fromDate: string, toDate: string) => {
    setCustomDateRangeState({ fromDate, toDate });
    setPeriod('custom');
  };

  return {
    period,
    customDateRange,
    isLoading,
    isError,
    error,
    data,
    setPeriod,
    setCustomDateRange,
    refetch,
    dateRangeLabel,
  };
}
