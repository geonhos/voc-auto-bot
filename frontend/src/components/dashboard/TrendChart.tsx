'use client';

import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { TrendData } from '@/types/statistics';

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
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-80 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">기간별 VOC 접수 추이</h3>
        <div className="flex h-80 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    date: format(parseISO(item.date), 'MM/dd'),
  }));

  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">기간별 VOC 접수 추이</h3>
        {dateRange && (
          <span className="text-xs text-slate-500 dark:text-slate-400" aria-label={`기간: ${dateRange}`}>
            {dateRange}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis
            dataKey="date"
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
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="received"
            name="VOC 접수 건수"
            stroke="#556780"
            strokeWidth={2}
            dot={{ fill: '#556780', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6 }}
            fill="#556780"
            fillOpacity={0.1}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="해결"
            stroke="#6b8e6b"
            strokeWidth={2}
            dot={{ fill: '#6b8e6b', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="pending"
            name="미해결"
            stroke="#b38f4d"
            strokeWidth={2}
            dot={{ fill: '#b38f4d', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
