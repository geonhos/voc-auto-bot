'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendData } from '@/types/statistics';
import { format, parseISO } from 'date-fns';

interface TrendChartProps {
  data: TrendData[];
  dateRange?: string;
  isLoading?: boolean;
}

/**
 * @description Displays VOC trend over time with received, resolved, and pending counts
 */
export function TrendChart({ data, dateRange, isLoading }: TrendChartProps) {
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">일별 추이</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    date: format(parseISO(item.date), 'MM/dd'),
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">일별 추이</h3>
        {dateRange && (
          <span className="text-sm text-gray-500 dark:text-gray-400" aria-label={`기간: ${dateRange}`}>
            {dateRange}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
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
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="received"
            name="접수"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="해결"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="pending"
            name="미해결"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
