'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import { CategoryStats } from '@/types/statistics';

interface CategoryChartProps {
  data: CategoryStats[];
  limit?: number;
  isLoading?: boolean;
}

const COLORS = [
  '#556780', // primary
  '#6b8e6b', // success
  '#b38f4d', // warning
  '#5b8a8a', // info
  '#a16060', // danger
  '#8a9db3', // primary-light
  '#475569', // slate-600
  '#78716c', // stone-500
  '#2d3745', // primary-dark
  '#44403c', // stone-700
];

/**
 * @description Displays VOC distribution by category as a pie chart
 * @param limit - Maximum number of categories to display (default: all)
 */
export function CategoryChart({ data, limit, isLoading }: CategoryChartProps) {
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
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">카테고리별 분포</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // Apply limit if specified
  const limitedData = limit ? data.slice(0, limit) : data;

  const chartData = limitedData.map((item) => ({
    name: item.categoryName,
    value: item.count,
    percentage: item.percentage,
  }));

  const renderLabel = (entry: { name: string; percentage?: number }) => {
    const percentage = entry.percentage ?? 0;
    return `${entry.name} (${percentage.toFixed(1)}%)`;
  };

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">카테고리별 VOC 현황</h3>
        {limit && <span className="text-xs text-slate-500 dark:text-slate-400">상위 {limit}개</span>}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
