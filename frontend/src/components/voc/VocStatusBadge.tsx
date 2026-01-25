'use client';

import { cn } from '@/lib/utils';
import type { VocStatus } from '@/types';

interface VocStatusBadgeProps {
  status: VocStatus;
  className?: string;
}

const statusLabels: Record<VocStatus, string> = {
  RECEIVED: '접수',
  ASSIGNED: '배정됨',
  IN_PROGRESS: '처리중',
  PENDING: '대기',
  RESOLVED: '해결',
  CLOSED: '종료',
  REJECTED: '거부',
};

const statusColors: Record<VocStatus, string> = {
  RECEIVED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-slate-100 text-slate-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export function VocStatusBadge({ status, className }: VocStatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
        statusColors[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
