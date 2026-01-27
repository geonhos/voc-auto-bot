'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { Voc, PageResponse } from '@/types';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (vocs.empty) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
        검색 결과가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                티켓번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                등록일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                최종 수정
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vocs.content.map((voc) => (
              <tr
                key={voc.id}
                onClick={() => handleRowClick(voc.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                  {voc.ticketId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate">{voc.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {voc.category ? (
                    <div className="text-xs">
                      <div className="text-gray-900">{voc.category.name}</div>
                      {voc.category.code && (
                        <div className="text-gray-400">{voc.category.code}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">미분류</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <VocStatusBadge status={voc.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <VocPriorityBadge priority={voc.priority} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {voc.assignee ? (
                    <div>
                      <div className="font-medium text-gray-900">{voc.assignee.name}</div>
                      <div className="text-gray-400 text-xs">@{voc.assignee.username}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">미배정</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(voc.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(voc.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
              총 <span className="font-medium">{vocs.totalElements}</span>개 (
              <span className="font-medium">{vocs.page + 1}</span> /{' '}
              <span className="font-medium">{vocs.totalPages}</span> 페이지)
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-600">
                페이지당
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">개</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(vocs.page - 1)}
              disabled={vocs.first}
              className={cn(
                'px-3 py-1 border border-gray-300 rounded text-sm',
                vocs.first
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
            >
              이전
            </button>
            <button
              onClick={() => onPageChange(vocs.page + 1)}
              disabled={vocs.last}
              className={cn(
                'px-3 py-1 border border-gray-300 rounded text-sm',
                vocs.last
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
