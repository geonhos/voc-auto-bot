'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { VocStatusHistory, VocStatus } from '@/types';
import { cn } from '@/lib/utils';

interface VocStatusTimelineProps {
  statusHistory: VocStatusHistory[];
  currentStatus: VocStatus;
}

const statusIcons: Record<string, string> = {
  completed: 'check',
  in_progress: 'play_arrow',
  pending: 'radio_button_unchecked',
  failed: 'close',
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-600 text-white',
  in_progress: 'bg-blue-600 text-white',
  pending: 'bg-gray-200 text-gray-600',
  failed: 'bg-red-600 text-white',
};

/**
 * @description Timeline component for VOC status history
 */
export function VocStatusTimeline({ statusHistory, currentStatus }: VocStatusTimelineProps) {
  const getTimelineState = (historyStatus: VocStatus, index: number): 'completed' | 'in_progress' | 'pending' => {
    if (historyStatus === currentStatus && index === statusHistory.length - 1) {
      return 'in_progress';
    }
    return 'completed';
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-bold mb-6 text-slate-700 dark:text-slate-300">처리 진행 상태</h3>

      <ol className="space-y-6" role="list">
        {statusHistory.map((history, index) => {
          const state = getTimelineState(history.status, index);
          const isLast = index === statusHistory.length - 1;

          return (
            <li
              key={history.id}
              className={cn('relative pl-8', !isLast && 'after:absolute after:left-[0.6875rem] after:top-8 after:bottom-[-1.5rem] after:w-[2px] after:bg-gray-200 dark:after:bg-gray-700')}
            >
              <div
                className={cn(
                  'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center',
                  statusColors[state]
                )}
              >
                <span className="material-icons-outlined text-sm">
                  {statusIcons[state]}
                </span>
              </div>

              <div>
                <p
                  className={cn(
                    'font-semibold',
                    state === 'completed' && 'text-green-600',
                    state === 'in_progress' && 'text-blue-600',
                    state === 'pending' && 'text-gray-400'
                  )}
                >
                  {history.statusLabel}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {format(new Date(history.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                </p>
                {history.note && (
                  <p className="text-xs text-blue-600 mt-1">{history.note}</p>
                )}
                {history.changedBy && (
                  <p className="text-xs text-slate-400 mt-1">담당자: {history.changedBy}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
