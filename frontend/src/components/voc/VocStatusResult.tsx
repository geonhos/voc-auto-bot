'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import type { VocStatusDetail } from '@/types';
import { VocStatusBadge } from './VocStatusBadge';
import { VocStatusTimeline } from './VocStatusTimeline';
import { VocPriorityBadge } from './VocPriorityBadge';

interface VocStatusResultProps {
  vocStatus: VocStatusDetail;
}

/**
 * @description Component for displaying VOC status lookup result
 */
export function VocStatusResult({ vocStatus }: VocStatusResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTicketId = async () => {
    try {
      await navigator.clipboard.writeText(vocStatus.ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy ticket ID:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-8">
        <h2 className="text-xl font-bold mb-6">조회 결과</h2>

        {/* 기본 정보 카드 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Ticket ID</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-lg">{vocStatus.ticketId}</span>
                <button
                  onClick={handleCopyTicketId}
                  className="p-1 hover:text-blue-600 transition-colors"
                  title="복사"
                  aria-label="Ticket ID 복사"
                >
                  <span className="material-icons-outlined text-slate-400 text-lg">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
            <div>
              <VocStatusBadge status={vocStatus.status} />
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">접수일시</p>
            <p className="font-medium">
              {format(new Date(vocStatus.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })} KST
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">제목</p>
            <p className="font-medium line-clamp-2">{vocStatus.title}</p>
          </div>

          {vocStatus.category && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">카테고리</p>
              <p className="font-medium">{vocStatus.category}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">우선순위</p>
            <VocPriorityBadge priority={vocStatus.priority} />
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">최종 수정일시</p>
            <p className="font-medium">
              {format(new Date(vocStatus.updatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })} KST
            </p>
          </div>
        </div>

        {/* 처리 진행 상태 타임라인 */}
        {vocStatus.statusHistory && vocStatus.statusHistory.length > 0 && (
          <VocStatusTimeline
            statusHistory={vocStatus.statusHistory}
            currentStatus={vocStatus.status}
          />
        )}
      </div>
    </div>
  );
}
