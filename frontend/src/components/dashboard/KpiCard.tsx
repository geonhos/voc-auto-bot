import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  className?: string;
}

export function KpiCard({ title, value, icon, change, className }: KpiCardProps) {
  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return 'text-green-600 dark:text-green-500';
      case 'decrease':
        return 'text-red-600 dark:text-red-500';
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case 'increase':
        return <ArrowUpIcon className="h-3 w-3" aria-hidden="true" />;
      case 'decrease':
        return <ArrowDownIcon className="h-3 w-3" aria-hidden="true" />;
      case 'neutral':
        return <MinusIcon className="h-3 w-3" aria-hidden="true" />;
    }
  };

  const formatChangeValue = () => {
    if (!change) return '';
    const prefix = change.type === 'increase' ? '+' : '';
    return `${prefix}${change.value}%`;
  };

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6',
        'transition-all hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        <div className="text-primary dark:text-primary-light">{icon}</div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change && (
            <p
              className={cn('text-sm mt-1 flex items-center gap-1', getChangeColor())}
              aria-label={change.label || `전일 대비 ${formatChangeValue()}`}
            >
              <span className="font-medium">{formatChangeValue()}</span>
              {getChangeIcon()}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">전일 대비</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
