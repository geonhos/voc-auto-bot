'use client';

import {
  BarChart3Icon,
  ClockIcon,
  CheckCircleIcon,
  ActivityIcon,
  RefreshCwIcon,
  CalendarIcon,
  PlusCircleIcon,
  KanbanIcon,
  MailIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import {
  DashboardLayout,
  DashboardSection,
  KpiGrid,
  ChartGrid,
} from '@/components/dashboard/DashboardLayout';
import { DatePicker } from '@/components/dashboard/DatePicker';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SlaWidget } from '@/components/dashboard/SlaWidget';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { useDashboardViewModel, REFRESH_INTERVAL_OPTIONS } from '@/hooks/useDashboardViewModel';
import type { PeriodType, RefreshIntervalType } from '@/hooks/useDashboardViewModel';

function formatKpiValue(value: number, suffix: string): string {
  return `${Math.round(value).toLocaleString()}${suffix}`;
}

function formatDecimalKpiValue(value: number, suffix: string): string {
  return `${value.toFixed(1)}${suffix}`;
}

export default function DashboardPage() {
  const {
    period,
    isLoading,
    data,
    setPeriod,
    setCustomDateRange,
    refetch,
    dateRangeLabel,
    customDateRange,
    refreshInterval,
    setRefreshInterval,
  } = useDashboardViewModel();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    if (newPeriod === 'custom') {
      setIsDatePickerOpen(true);
    } else {
      setPeriod(newPeriod);
    }
  };

  // MAJ-003: Memoize handler to prevent unnecessary re-renders
  const handleDateRangeApply = useCallback((startDate: string, endDate: string) => {
    setCustomDateRange(startDate, endDate);
  }, [setCustomDateRange]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">통계 대시보드</h1>
          <p className="text-gray-500">VOC 처리 현황을 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">통계 대시보드</h1>
          <p className="text-gray-500">VOC 처리 현황을 한눈에 확인하세요.</p>
        </div>
        <div className="text-center py-12 text-gray-500">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const { kpi, trend, categoryStats, statusDistribution } = data;

  // KPI 데이터 기본값 설정
  const safeKpi = {
    totalVocs: kpi?.totalVocs ?? 0,
    avgResolutionTimeHours: kpi?.avgResolutionTimeHours ?? 0,
    resolutionRate: kpi?.resolutionRate ?? 0,
    pendingVocs: kpi?.pendingVocs ?? 0,
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">통계 대시보드</h1>
        <p className="text-gray-500">VOC 처리 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/voc/input"
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <PlusCircleIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">새 VOC 등록</span>
        </Link>
        <Link
          href="/voc/kanban"
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <KanbanIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">VOC 칸반보드</span>
        </Link>
        <Link
          href="/email/compose"
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <MailIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">이메일 발송</span>
        </Link>
      </div>

      <DashboardLayout>
        <DashboardSection>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                기간 선택:
              </span>
              <div role="group" aria-label="기간 선택" className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePeriodChange('today')}
                  className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                    period === 'today'
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-pressed={period === 'today'}
                  aria-label="오늘"
                >
                  오늘
                </button>
                <button
                  onClick={() => handlePeriodChange('7days')}
                  className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                    period === '7days'
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-pressed={period === '7days'}
                  aria-label="최근 7일"
                >
                  7일
                </button>
                <button
                  onClick={() => handlePeriodChange('30days')}
                  className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                    period === '30days'
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-pressed={period === '30days'}
                  aria-label="최근 30일"
                >
                  30일
                </button>
                <DatePicker
                  isOpen={isDatePickerOpen}
                  onOpenChange={setIsDatePickerOpen}
                  onApply={handleDateRangeApply}
                  initialStartDate={customDateRange.fromDate}
                  initialEndDate={customDateRange.toDate}
                >
                  <button
                    onClick={() => handlePeriodChange('custom')}
                    className={`px-4 py-2 text-sm font-medium rounded border transition-colors flex items-center gap-1 ${
                      period === 'custom'
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    aria-pressed={period === 'custom'}
                    aria-label="사용자 지정 날짜 범위"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>사용자 지정</span>
                  </button>
                </DatePicker>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Refresh interval selector */}
                <div className="flex items-center gap-1.5">
                  <RefreshCwIcon className="h-4 w-4 text-gray-500" />
                  <select
                    value={refreshInterval === false ? 'manual' : String(refreshInterval)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRefreshInterval(val === 'manual' ? false : (Number(val) as RefreshIntervalType));
                    }}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    aria-label="자동 갱신 주기"
                  >
                    {REFRESH_INTERVAL_OPTIONS.map((opt) => (
                      <option key={String(opt.value)} value={opt.value === false ? 'manual' : String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 text-sm font-medium rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                  aria-label="데이터 새로고침"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  <span>새로고침</span>
                </button>
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection>
          <KpiGrid>
            <KpiCard
              title="총 접수 건수"
              value={<AnimatedCounter value={safeKpi.totalVocs} formatFn={(v) => formatKpiValue(v, '건')} />}
              icon={<BarChart3Icon className="h-6 w-6" />}
              change={kpi?.totalVocsChange}
            />
            <KpiCard
              title="평균 처리 시간"
              value={<AnimatedCounter value={safeKpi.avgResolutionTimeHours} formatFn={(v) => formatDecimalKpiValue(v, '시간')} />}
              icon={<ClockIcon className="h-6 w-6" />}
              change={kpi?.avgResolutionTimeChange}
            />
            <KpiCard
              title="완료율"
              value={<AnimatedCounter value={safeKpi.resolutionRate} formatFn={(v) => formatDecimalKpiValue(v, '%')} />}
              icon={<CheckCircleIcon className="h-6 w-6" />}
              change={kpi?.resolutionRateChange}
            />
            <KpiCard
              title="처리 중"
              value={<AnimatedCounter value={safeKpi.pendingVocs} formatFn={(v) => formatKpiValue(v, '건')} />}
              icon={<ActivityIcon className="h-6 w-6" />}
              change={kpi?.pendingVocsChange}
            />
          </KpiGrid>
        </DashboardSection>

        <DashboardSection>
          <TrendChart data={trend} dateRange={dateRangeLabel} />
        </DashboardSection>

        <DashboardSection>
          <ChartGrid columns={2}>
            <CategoryChart data={categoryStats} limit={10} />
            <StatusChart data={statusDistribution} />
          </ChartGrid>
        </DashboardSection>

        <DashboardSection>
          <SentimentChart />
        </DashboardSection>

        {/* SLA Widget + Activity Feed */}
        <DashboardSection>
          <ChartGrid columns={2}>
            <SlaWidget />
            <ActivityFeed />
          </ChartGrid>
        </DashboardSection>

        <DashboardSection>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
            <span className="material-icons-outlined text-blue-600 dark:text-blue-400">info</span>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              통계 데이터는 매시간 자동으로 갱신됩니다. 차트의 데이터 포인트를 클릭하면 해당
              기간 또는 카테고리로 필터링된 VOC 리스트를 확인할 수 있습니다. 최대 90일까지 조회
              가능합니다.
            </p>
          </div>
        </DashboardSection>
      </DashboardLayout>
    </div>
  );
}
