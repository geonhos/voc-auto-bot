'use client';

import {
  PlusCircleIcon,
  ArrowRightCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
} from 'lucide-react';
import { useMemo } from 'react';

import { useRecentVocs } from '@/hooks/useStatistics';
import type { Voc, VocStatus } from '@/types/voc';

interface ActivityItem {
  id: number;
  vocId: number;
  ticketId: string;
  title: string;
  type: 'created' | 'status_change' | 'resolved' | 'rejected';
  status: VocStatus;
  timestamp: string;
}

const STATUS_LABELS: Record<VocStatus, string> = {
  NEW: '신규 등록',
  IN_PROGRESS: '처리 중',
  PENDING: '대기 중',
  RESOLVED: '해결 완료',
  CLOSED: '종료',
  REJECTED: '반려',
};

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'created':
      return <PlusCircleIcon className="h-4 w-4 text-blue-500" />;
    case 'status_change':
      return <ArrowRightCircleIcon className="h-4 w-4 text-amber-500" />;
    case 'resolved':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
  }
}

function getActivityType(voc: Voc): ActivityItem['type'] {
  if (voc.status === 'RESOLVED') return 'resolved';
  if (voc.status === 'REJECTED') return 'rejected';
  if (voc.status === 'NEW') return 'created';
  return 'status_change';
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date().getTime();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function ActivityFeed() {
  const { data: recentVocs, isLoading } = useRecentVocs(10);

  const activities = useMemo<ActivityItem[]>(() => {
    if (!recentVocs) return [];

    return recentVocs.map((voc: Voc) => ({
      id: voc.id,
      vocId: voc.id,
      ticketId: voc.ticketId,
      title: voc.title,
      type: getActivityType(voc),
      status: voc.status,
      timestamp: voc.updatedAt,
    }));
  }, [recentVocs]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          최근 활동
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          최근 활동
        </h3>
        <p className="text-sm text-gray-500 text-center py-4">최근 활동이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-gray-500" />
        최근 활동
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />

        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id} className="relative flex gap-3 pl-0">
              <div className="relative z-10 mt-0.5 shrink-0 bg-white dark:bg-gray-800 p-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.ticketId}</span>
                  <span className="text-gray-500 mx-1">-</span>
                  <span className="text-gray-700 dark:text-gray-300">{STATUS_LABELS[activity.status]}</span>
                </p>
                <p className="text-xs text-gray-500 truncate">{activity.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
