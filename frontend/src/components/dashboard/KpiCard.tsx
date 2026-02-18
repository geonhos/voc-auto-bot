import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
    count?: number; // 전일 대비 건수 변화
  };
  className?: string;
}

export function KpiCard({ title, value, icon, change, className }: KpiCardProps) {
  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return 'text-info';
      case 'decrease':
        return 'text-success';
      case 'neutral':
        return 'text-slate-500 dark:text-slate-400';
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
        'bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6',
        'transition-all hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</span>
        <div className="text-primary">{icon}</div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {change && (
            <p
              className={cn('text-sm mt-1 flex items-center gap-1 flex-wrap', getChangeColor())}
              aria-label={change.label || `전 기간 대비 ${formatChangeValue()}${change.count !== undefined ? ` (${change.count}건)` : ''}`}
            >
              <span className="font-medium">{formatChangeValue()}</span>
              {change.count !== undefined && (
                <span className="font-medium">({change.count.toLocaleString()}건)</span>
              )}
              {getChangeIcon()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
