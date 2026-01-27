'use client';

import { format, parseISO } from 'date-fns';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

import { VocPriorityBadge } from '@/components/voc/VocPriorityBadge';
import { VocStatusBadge } from '@/components/voc/VocStatusBadge';
import { Voc } from '@/types/voc';

interface RecentVocListProps {
  data: Voc[];
  isLoading?: boolean;
  maxItems?: number;
}

/**
 * @description Displays a list of recent VOCs with status and priority
 */
export function RecentVocList({ data, isLoading, maxItems = 10 }: RecentVocListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">최근 VOC</h3>
        <div className="flex h-40 items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const displayData = data.slice(0, maxItems);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">최근 VOC</h3>
        <Link
          href="/voc/table"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 dark:text-primary-light"
          aria-label="전체 VOC 목록 보기"
        >
          <span>전체 보기</span>
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-3">
        {displayData.map((voc) => (
          <Link
            key={voc.id}
            href={`/voc/${voc.id}`}
            className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-gray-50 dark:border-gray-700 dark:hover:border-primary dark:hover:bg-gray-700/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {voc.ticketId}
                  </span>
                  <VocStatusBadge status={voc.status} />
                  <VocPriorityBadge priority={voc.priority} />
                </div>

                <h4 className="mb-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {voc.title}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {voc.category && (
                    <span className="flex items-center gap-1">
                      <span aria-label="카테고리">{voc.category.name}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span aria-label="고객명">{voc.customerName}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <time dateTime={voc.createdAt} aria-label="접수일시">
                      {format(parseISO(voc.createdAt), 'yyyy-MM-dd HH:mm')}
                    </time>
                  </span>
                </div>
              </div>

              <ArrowRightIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>

      {data.length > maxItems && (
        <div className="mt-4 text-center">
          <Link
            href="/voc/table"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 dark:text-primary-light"
          >
            <span>더 보기 ({data.length - maxItems}건)</span>
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
