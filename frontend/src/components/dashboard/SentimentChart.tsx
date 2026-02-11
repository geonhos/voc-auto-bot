'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';

import { statisticsApi, type SentimentStats } from '@/lib/api/statisticsApi';

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#3B82F6', // blue
  negative: '#EF4444', // red
  neutral: '#9CA3AF',  // gray
};

const SENTIMENT_LABELS: Record<string, string> = {
  positive: '긍정',
  negative: '부정',
  neutral: '중립',
};

export function SentimentChart() {
  const { data: sentimentStats, isLoading } = useQuery({
    queryKey: ['statistics', 'sentiment'],
    queryFn: () => statisticsApi.getSentimentStats(),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">감성 분석 분포</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!sentimentStats) {
    return null;
  }

  const chartData = ['positive', 'negative', 'neutral']
    .filter((key) => (sentimentStats[key] ?? 0) > 0)
    .map((key) => ({
      name: SENTIMENT_LABELS[key] || key,
      value: sentimentStats[key] ?? 0,
      color: SENTIMENT_COLORS[key] || '#9CA3AF',
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">감성 분석 분포</h3>
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          감성 분석 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">감성 분석 분포</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}건`, '']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {['positive', 'negative', 'neutral'].map((key) => (
          <div key={key} className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="text-xs text-gray-500">{SENTIMENT_LABELS[key]}</div>
            <div className="text-lg font-bold" style={{ color: SENTIMENT_COLORS[key] }}>
              {sentimentStats[key] ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
