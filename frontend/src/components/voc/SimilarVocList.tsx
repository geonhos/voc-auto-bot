'use client';

import { useState } from 'react';
import type { PageResponse, SimilarVoc } from '@/types';
import { SimilarVocCard } from './SimilarVocCard';
import { cn } from '@/lib/utils';

interface SimilarVocListProps {
  vocs: PageResponse<SimilarVoc>;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onVocClick?: (vocId: number) => void;
}

/**
 * @description List component for displaying similar VOCs with pagination
 * Used in the full list page to show all similar VOCs
 */
export function SimilarVocList({ vocs, isLoading, onPageChange, onVocClick }: SimilarVocListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (vocs.empty) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">유사한 VOC가 없습니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          현재 이 VOC와 유사한 다른 VOC가 발견되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vocs.content.map((voc) => (
          <SimilarVocCard key={voc.id} voc={voc} onClick={onVocClick} />
        ))}
      </div>

      {/* Pagination */}
      {vocs.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            총 <span className="font-medium">{vocs.totalElements}</span>개 (
            <span className="font-medium">{vocs.page + 1}</span> /{' '}
            <span className="font-medium">{vocs.totalPages}</span> 페이지)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(0)}
              disabled={vocs.first}
              className={cn(
                'px-3 py-1 border border-gray-300 rounded text-sm',
                vocs.first
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
              aria-label="첫 페이지"
            >
              처음
            </button>
            <button
              onClick={() => onPageChange(vocs.page - 1)}
              disabled={vocs.first}
              className={cn(
                'px-3 py-1 border border-gray-300 rounded text-sm',
                vocs.first
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
              aria-label="이전 페이지"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {vocs.page + 1} / {vocs.totalPages}
            </span>
            <button
              onClick={() => onPageChange(vocs.page + 1)}
              disabled={vocs.last}
              className={cn(
                'px-3 py-1 border border-gray-300 rounded text-sm',
                vocs.last
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
              aria-label="다음 페이지"
            >
              다음
            </button>
            <button
              onClick={() => onPageChange(vocs.totalPages - 1)}
              disabled={vocs.last}
              className={cn(
                'px-3 py-1 border border-gray-300 rounded text-sm',
                vocs.last
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              )}
              aria-label="마지막 페이지"
            >
              마지막
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
