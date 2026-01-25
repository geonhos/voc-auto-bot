'use client';

import { cn } from '@/lib/utils';
import type { VocPriority } from '@/types';

interface VocPriorityBadgeProps {
  priority: VocPriority;
  className?: string;
}

const priorityLabels: Record<VocPriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

const priorityColors: Record<VocPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function VocPriorityBadge({ priority, className }: VocPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
        priorityColors[priority],
        className
      )}
    >
      {priorityLabels[priority]}
    </span>
  );
}
