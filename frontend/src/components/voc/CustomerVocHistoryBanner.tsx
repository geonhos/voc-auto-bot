'use client';

import type { Voc } from '@/types';

import { VocPriorityBadge } from './VocPriorityBadge';
import { VocStatusBadge } from './VocStatusBadge';

interface CustomerVocHistoryBannerProps {
  unresolvedVocs: Voc[];
  unresolvedCount: number;
  isLoading: boolean;
  customerEmail: string;
}

const MAX_DISPLAY = 3;

export function CustomerVocHistoryBanner({
  unresolvedVocs,
  unresolvedCount,
  isLoading,
  customerEmail,
}: CustomerVocHistoryBannerProps) {
  if (isLoading) {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  if (!customerEmail || unresolvedCount === 0) return null;

  const displayed = unresolvedVocs.slice(0, MAX_DISPLAY);
  const remaining = unresolvedCount - MAX_DISPLAY;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="p-4 bg-amber-50 border border-amber-300 rounded-lg"
    >
      <div className="flex items-start gap-2">
        <span className="text-amber-600 text-lg leading-none mt-0.5">&#9888;</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            이 고객의 미해결 VOC가 {unresolvedCount}건 있습니다
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            중복 접수 여부를 확인해 주세요.
          </p>

          <ul className="mt-3 space-y-2">
            {displayed.map((voc) => (
              <li
                key={voc.id}
                className="flex items-center gap-2 text-xs text-gray-700"
              >
                <span className="font-mono text-amber-700 shrink-0">
                  {voc.ticketId}
                </span>
                <VocStatusBadge status={voc.status} />
                <VocPriorityBadge priority={voc.priority} />
                <span className="truncate">{voc.title}</span>
              </li>
            ))}
          </ul>

          {remaining > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              + {remaining}건 더
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
