'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { StatusDistribution } from '@/types/statistics';

interface StatusChartProps {
  data: StatusDistribution[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#3b82f6',
  ASSIGNED: '#8b5cf6',
  IN_PROGRESS: '#f59e0b',
  PENDING: '#ef4444',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
  REJECTED: '#dc2626',
};

/**
 * @description Displays VOC distribution by status as a bar chart
 */
export function StatusChart({ data, isLoading }: StatusChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-80 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">상태별 분포</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다</p>
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">상태별 분포</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickLine={false}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string, props) => {
              const percentage = props?.payload?.percentage ?? 0;
              return [`${value}건 (${percentage.toFixed(1)}%)`, name];
            }}
          />
          <Bar dataKey="value" name="건수" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
