'use client';

import {
  BarChart3Icon,
  ClockIcon,
  CheckCircleIcon,
  ActivityIcon,
  RefreshCwIcon,
  CalendarIcon,
} from 'lucide-react';
import { useDashboardViewModel } from '@/hooks/useDashboardViewModel';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import {
  DashboardLayout,
  DashboardSection,
  KpiGrid,
  ChartGrid,
} from '@/components/dashboard/DashboardLayout';
import type { PeriodType } from '@/hooks/useDashboardViewModel';

export default function DashboardPage() {
  const { period, isLoading, data, setPeriod, refetch, dateRangeLabel } =
    useDashboardViewModel();

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">통계 대시보드</h1>
        <p className="text-gray-500">VOC 처리 현황을 한눈에 확인하세요.</p>
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
                <button
                  onClick={() => handlePeriodChange('custom')}
                  className={`px-4 py-2 text-sm font-medium rounded border transition-colors flex items-center gap-1 ${
                    period === 'custom'
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-pressed={period === 'custom'}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>사용자 지정</span>
                </button>
              </div>
              <div className="ml-auto">
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
              value={`${kpi.totalVocs.toLocaleString()}건`}
              icon={<BarChart3Icon className="h-6 w-6" />}
              change={{ value: 12, type: 'increase', label: '전 기간 대비 12% 증가' }}
            />
            <KpiCard
              title="평균 처리 시간"
              value={`${kpi.avgResolutionTimeHours.toFixed(1)}시간`}
              icon={<ClockIcon className="h-6 w-6" />}
              change={{ value: 5, type: 'decrease', label: '전 기간 대비 5% 감소' }}
            />
            <KpiCard
              title="완료율"
              value={`${kpi.resolutionRate.toFixed(1)}%`}
              icon={<CheckCircleIcon className="h-6 w-6" />}
              change={{ value: 3, type: 'increase', label: '전 기간 대비 3% 증가' }}
            />
            <KpiCard
              title="처리 중"
              value={`${kpi.pendingVocs.toLocaleString()}건`}
              icon={<ActivityIcon className="h-6 w-6" />}
              change={{
                value: parseFloat(((kpi.pendingVocs / kpi.totalVocs) * 100).toFixed(2)),
                type: 'neutral',
                label: `전체 VOC의 ${((kpi.pendingVocs / kpi.totalVocs) * 100).toFixed(1)}%`,
              }}
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
