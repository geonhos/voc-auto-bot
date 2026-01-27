'use client';

import { useSimilarVocModalViewModel } from '@/hooks/useSimilarVocModalViewModel';
import { cn } from '@/lib/utils';

import { SimilarVocCard } from './SimilarVocCard';

interface SimilarVocModalProps {
  vocId: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * @description Modal for displaying similar VOCs
 * Shows up to 5 similar VOCs with "View All" option
 */
export function SimilarVocModal({ vocId, isOpen, onClose }: SimilarVocModalProps) {
  const { similarVocs, isLoading, handleViewAll, handleVocClick, handleClose } =
    useSimilarVocModalViewModel({
      vocId,
      isOpen,
      onClose,
    });

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="similar-voc-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 id="similar-voc-modal-title" className="text-lg font-semibold text-gray-900">
              유사 VOC
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'text-gray-400 hover:text-gray-600 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1'
              )}
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">이 VOC와 유사한 다른 VOC들을 확인하세요</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !similarVocs || similarVocs.length === 0 ? (
            <div className="text-center py-12">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {similarVocs.map((voc) => (
                <SimilarVocCard key={voc.id} voc={voc} onClick={handleVocClick} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && similarVocs && similarVocs.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                상위 {similarVocs.length}개의 유사 VOC를 표시하고 있습니다
              </p>
              <button
                type="button"
                onClick={handleViewAll}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
              >
                전체 보기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
