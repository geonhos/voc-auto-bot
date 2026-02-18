'use client';

import { AlertTriangleIcon, ClockIcon, ExternalLinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { useVocs } from '@/hooks/useVocs';
import type { Voc } from '@/types/voc';

function getTimeRemaining(dueDate: string): { hours: number; minutes: number; overdue: boolean } {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  const overdue = diff < 0;
  const absDiff = Math.abs(diff);
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, overdue };
}

function formatCountdown(dueDate: string): string {
  const { hours, minutes, overdue } = getTimeRemaining(dueDate);
  if (overdue) {
    return hours > 0 ? `-${hours}h ${minutes}m` : `-${minutes}m`;
  }
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function isWithin24Hours(dueDate: string): boolean {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  return diff <= 24 * 60 * 60 * 1000;
}

export function SlaWidget() {
  const router = useRouter();
  const { data: vocPage, isLoading } = useVocs({
    status: ['NEW', 'IN_PROGRESS', 'PENDING'],
    sortBy: 'dueDate',
    sortDirection: 'ASC',
    size: 50,
  });

  const { urgentVocs, overdueCount, approachingCount } = useMemo(() => {
    if (!vocPage?.content) return { urgentVocs: [], overdueCount: 0, approachingCount: 0 };

    const now = new Date().getTime();
    const vocsWithDue = vocPage.content.filter((v: Voc) => v.dueDate);

    let overdue = 0;
    let approaching = 0;
    const urgent: Voc[] = [];

    for (const voc of vocsWithDue) {
      const due = new Date(voc.dueDate!).getTime();
      const diff = due - now;

      if (diff < 0) {
        overdue++;
        if (urgent.length < 5) urgent.push(voc);
      } else if (diff <= 24 * 60 * 60 * 1000) {
        approaching++;
        if (urgent.length < 5) urgent.push(voc);
      }
    }

    return { urgentVocs: urgent, overdueCount: overdue, approachingCount: approaching };
  }, [vocPage]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
          SLA 임박 VOC
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const totalUrgent = overdueCount + approachingCount;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
        SLA 임박 VOC
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
          <p className="text-xs text-red-500 dark:text-red-400">기한 초과</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{approachingCount}</p>
          <p className="text-xs text-amber-500 dark:text-amber-400">24시간 이내</p>
        </div>
      </div>

      {totalUrgent === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          SLA 임박 VOC가 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {urgentVocs.map((voc) => {
            const { overdue } = getTimeRemaining(voc.dueDate!);
            return (
              <li
                key={voc.id}
                onClick={() => router.push(`/voc/${voc.id}`)}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{voc.title}</p>
                  <p className="text-xs text-gray-500">{voc.ticketId}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span
                    className={`text-xs font-mono font-semibold flex items-center gap-1 ${
                      overdue
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <ClockIcon className="h-3 w-3" />
                    {formatCountdown(voc.dueDate!)}
                  </span>
                  <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
