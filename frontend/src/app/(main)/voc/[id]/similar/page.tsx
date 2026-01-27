'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { SimilarVocList } from '@/components/voc/SimilarVocList';
import { useSimilarVocsPaginated } from '@/hooks/useSimilarVocs';
import { useVoc } from '@/hooks/useVocs';
import { cn } from '@/lib/utils';

/**
 * @description ViewModel Hook for Similar VOC Full List Page
 * Manages pagination and navigation for the similar VOC list
 */
function useSimilarVocPageViewModel(vocId: number) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const { data: vocs, isLoading } = useSimilarVocsPaginated(vocId, { page, size });
  const { data: currentVoc, isLoading: isCurrentVocLoading } = useVoc(vocId);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVocClick = (similarVocId: number) => {
    router.push(`/voc/${similarVocId}`);
  };

  const handleBackToVoc = () => {
    router.back();
  };

  return {
    vocs,
    currentVoc,
    isLoading: isLoading || isCurrentVocLoading,
    handlePageChange,
    handleVocClick,
    handleBackToVoc,
  };
}

/**
 * @description Similar VOC Full List Page
 * Displays all similar VOCs with pagination
 */
export default function SimilarVocPage() {
  const params = useParams();
  const vocId = Number(params.id);

  const { vocs, currentVoc, isLoading, handlePageChange, handleVocClick, handleBackToVoc } =
    useSimilarVocPageViewModel(vocId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={handleBackToVoc}
          className={cn(
            'inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900',
            'mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          VOC 상세로 돌아가기
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">유사 VOC</h1>
            {currentVoc && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">기준 VOC</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium text-blue-600">{currentVoc.ticketId}</span>
                  <span className="text-sm text-gray-900">{currentVoc.title}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">AI 분석을 통해 발견된 유사 VOC입니다</p>
              <p className="mt-1 text-blue-700">
                유사도가 높은 VOC를 참고하여 더 나은 처리 방안을 찾을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {vocs && (
        <SimilarVocList
          vocs={vocs}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onVocClick={handleVocClick}
        />
      )}
    </div>
  );
}
