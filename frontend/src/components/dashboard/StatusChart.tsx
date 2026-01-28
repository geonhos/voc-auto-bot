'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { StatusDistribution } from '@/types/statistics';

interface StatusChartProps {
  data: StatusDistribution[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#e7e5e4', // status-received
  IN_PROGRESS: '#f0e8d9', // status-processing
  PENDING: '#ebe2e0', // status-analysis-failed
  RESOLVED: '#e1e9e0', // status-completed
  CLOSED: '#e1e9e0', // status-completed
  REJECTED: '#ebe2e0', // status-rejected
};

/**
 * @description Displays VOC distribution by status as a bar chart
 */
export function StatusChart({ data, isLoading }: StatusChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-80 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">상태별 분포</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.statusLabel,
    value: item.count,
    percentage: item.percentage,
    status: item.status,
  }));

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">상태별 VOC 현황</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickLine={false}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              color: 'white',
            }}
            formatter={(value: number, name: string, props) => {
              const percentage = props?.payload?.percentage ?? 0;
              return [`${value}건 (${percentage.toFixed(1)}%)`, name];
            }}
          />
          <Bar dataKey="value" name="건수" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#556780'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
