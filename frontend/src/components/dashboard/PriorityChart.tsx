'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PriorityStats } from '@/types/statistics';

interface PriorityChartProps {
  data: PriorityStats[];
  isLoading?: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#10b981',
};

/**
 * @description Displays VOC distribution by priority as a bar chart
 */
export function PriorityChart({ data, isLoading }: PriorityChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-80 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">우선순위별 분포</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.priorityLabel,
    count: item.count,
    percentage: item.percentage,
    priority: item.priority,
  }));

  const getBarColor = (priority: string) => {
    return PRIORITY_COLORS[priority] || '#6b7280';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">우선순위별 분포</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number, _name: string, props) => {
              const percentage = props?.payload?.percentage ?? 0;
              return [`${value}건 (${percentage.toFixed(1)}%)`, '건수'];
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Bar
            dataKey="count"
            radius={[0, 8, 8, 0]}
            label={{
              position: 'right',
              formatter: (value: number) => `${value}건`,
              style: { fontSize: '12px', fill: '#6b7280' },
            }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.priority)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
