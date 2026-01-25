'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { VocStatusBadge } from './VocStatusBadge';
import type { VocHistory } from '@/types';

interface VocStatusHistoryProps {
  history: VocHistory[];
}

const actionLabels: Record<string, string> = {
  VOC_CREATED: 'VOC 접수 완료',
  STATUS_CHANGE: '상태 변경',
  CATEGORY_CHANGE: '카테고리 수정',
  ASSIGNEE_CHANGE: '담당자 변경',
  MEMO_ADDED: '메모 추가',
};

export function VocStatusHistory({ history }: VocStatusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">변경 이력</h2>
        <p className="text-sm text-gray-500">변경 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">변경 이력</h2>
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id} className="relative">
            {/* Timeline line */}
            {index !== history.length - 1 && (
              <div
                className="absolute left-2 top-8 bottom-0 w-0.5 bg-gray-200"
                aria-hidden="true"
              />
            )}

            <div className="flex items-start space-x-3">
              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {actionLabels[item.action] || item.action}
                  </p>
                  <time className="text-xs text-gray-500">
                    {format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                  </time>
                </div>

                <p className="text-xs text-gray-500 mb-2">{item.actor}</p>

                {/* Action details */}
                {item.action === 'STATUS_CHANGE' && item.details.from && item.details.to && (
                  <div className="flex items-center space-x-2 text-sm">
                    <VocStatusBadge status={item.details.from as any} />
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <VocStatusBadge status={item.details.to as any} />
                  </div>
                )}

                {item.action === 'CATEGORY_CHANGE' && (
                  <div className="text-sm text-gray-700">
                    {item.details.from && item.details.to && (
                      <p>
                        {item.details.from as string} → {item.details.to as string}
                      </p>
                    )}
                  </div>
                )}

                {item.action === 'ASSIGNEE_CHANGE' && (
                  <div className="text-sm text-gray-700">
                    {item.details.from && item.details.to ? (
                      <p>
                        {item.details.from as string} → {item.details.to as string}
                      </p>
                    ) : item.details.to ? (
                      <p>담당자 할당: {item.details.to as string}</p>
                    ) : null}
                  </div>
                )}

                {item.details.note && (
                  <p className="mt-1 text-sm text-gray-600">{item.details.note as string}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
