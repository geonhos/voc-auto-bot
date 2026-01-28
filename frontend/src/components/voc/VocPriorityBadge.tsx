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
  LOW: 'text-primary-light',
  MEDIUM: 'text-warning',
  HIGH: 'text-warning',
  URGENT: 'text-danger',
};

export function VocPriorityBadge({ priority, className }: VocPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        priorityColors[priority],
        className
      )}
    >
      {priority === 'URGENT' && (
        <span className="material-icons-outlined" style={{ fontSize: '12px' }}>
          warning
        </span>
      )}
      {priority === 'HIGH' && (
        <span className="material-icons-outlined" style={{ fontSize: '12px' }}>
          warning
        </span>
      )}
      {priority === 'MEDIUM' && (
        <span className="material-icons-outlined" style={{ fontSize: '12px' }}>
          info
        </span>
      )}
      {priority === 'LOW' && (
        <span className="material-icons-outlined" style={{ fontSize: '12px' }}>
          arrow_downward
        </span>
      )}
      {priorityLabels[priority]}
    </span>
  );
}
