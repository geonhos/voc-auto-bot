'use client';

import { cn } from '@/lib/utils';
import type { VocStatus } from '@/types';

interface VocStatusBadgeProps {
  status: VocStatus;
  className?: string;
}

const statusLabels: Record<VocStatus, string> = {
  NEW: '신규',
  IN_PROGRESS: '처리중',
  PENDING: '보류',
  RESOLVED: '해결완료',
  CLOSED: '종료',
  REJECTED: '반려',
};

const statusColors: Record<VocStatus, string> = {
  NEW: 'bg-[#e7e5e4] text-[#44403c]', // status-received
  IN_PROGRESS: 'bg-[#f0e8d9] text-[#7d6333]', // status-processing
  PENDING: 'bg-[#ebe2e0] text-[#704040]', // status-analysis-failed
  RESOLVED: 'bg-[#e1e9e0] text-[#475c47]', // status-completed
  CLOSED: 'bg-[#e1e9e0] text-[#475c47]', // status-completed
  REJECTED: 'bg-[#ebe2e0] text-[#704040]', // status-rejected
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
