'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { Voc, PageResponse } from '@/types';

import { BulkActionBar } from './BulkActionBar';
import { VocPriorityBadge } from './VocPriorityBadge';
import { VocStatusBadge } from './VocStatusBadge';

interface VocTableProps {
  vocs: PageResponse<Voc>;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function VocTable({ vocs, isLoading, onPageChange, onPageSizeChange }: VocTableProps) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const currentPageIds = vocs?.content?.map((v) => v.id) ?? [];
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRowClick = (vocId: number) => {
    router.push(`/voc/${vocId}`);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    onPageSizeChange(newSize);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (vocs.empty) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm">
        검색 결과가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BulkActionBar selectedIds={selectedIds} onClearSelection={() => setSelectedIds(new Set())} />
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                티켓번호
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                카테고리
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                등록일
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                최종 수정
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-light dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
            {vocs.content.map((voc) => (
              <tr
                key={voc.id}
                onClick={() => handleRowClick(voc.id)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-4 w-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(voc.id)}
                    onChange={() => toggleSelect(voc.id)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary hover:text-primary-dark hover:underline">
                  {voc.ticketId}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                  <div className="max-w-xs truncate font-medium hover:text-primary transition-colors">{voc.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                  {voc.category ? (
                    <div className="text-xs">
                      <div className="text-slate-900 dark:text-slate-100">{voc.category.name}</div>
                      {voc.category.code && (
                        <div className="text-slate-400 dark:text-slate-500">{voc.category.code}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">미분류</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <VocStatusBadge status={voc.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <VocPriorityBadge priority={voc.priority} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                  {voc.assignee ? (
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{voc.assignee.name}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-xs">@{voc.assignee.username}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">미배정</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(voc.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  {formatDateTime(voc.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              총 <span className="font-semibold text-slate-900 dark:text-slate-100">{vocs.totalElements}</span>개 (
              <span className="font-semibold">{vocs.page + 1}</span> /{' '}
              <span className="font-semibold">{vocs.totalPages}</span> 페이지)
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-slate-600 dark:text-slate-400">
                페이지당
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-slate-600 dark:text-slate-400">개</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(vocs.page - 1)}
              disabled={vocs.first}
              className={cn(
                'px-3 py-2 border border-border-light dark:border-border-dark rounded text-sm font-medium transition-colors',
                vocs.first
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-surface-light dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}
            >
              이전
            </button>
            <button
              onClick={() => onPageChange(vocs.page + 1)}
              disabled={vocs.last}
              className={cn(
                'px-3 py-2 border border-border-light dark:border-border-dark rounded text-sm font-medium transition-colors',
                vocs.last
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-surface-light dark:bg-surface-dark hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              )}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
