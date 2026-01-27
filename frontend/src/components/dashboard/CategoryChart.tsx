'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CategoryStats } from '@/types/statistics';

interface CategoryChartProps {
  data: CategoryStats[];
  limit?: number;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

/**
 * @description Displays VOC distribution by category as a pie chart
 * @param limit - Maximum number of categories to display (default: all)
 */
export function CategoryChart({ data, limit, isLoading }: CategoryChartProps) {
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">카테고리별 분포</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다</p>
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

  const renderLabel = (entry: { name: string; percentage: number }) => {
    return `${entry.name} (${entry.percentage.toFixed(1)}%)`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">카테고리별 분포</h3>
      <ResponsiveContainer width="100%" height={320}>
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
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
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
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
