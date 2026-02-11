'use client';

import { useRouter } from 'next/navigation';

import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface VocSuccessModalProps {
  isOpen: boolean;
  ticketId: string;
  onClose: () => void;
  onNewVoc: () => void;
}

/**
 * @description VocSuccessModal component
 * Displays success message after VOC submission with ticket number
 */
export function VocSuccessModal({ isOpen, ticketId, onClose, onNewVoc }: VocSuccessModalProps) {
  const router = useRouter();
  const { success } = useToast();

  if (!isOpen) return null;

  const handleGoToList = () => {
    router.push('/voc/table');
    onClose();
  };

  const handleNewVoc = () => {
    onNewVoc();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">VOC 등록 완료</h3>
              <p className="text-sm text-gray-600 mt-1">고객의 소리가 성공적으로 등록되었습니다</p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 py-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">등록된 티켓 번호</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-bold text-blue-600">{ticketId}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(ticketId);
                  success('티켓 번호가 복사되었습니다');
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                title="티켓 번호 복사"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              티켓 번호를 통해 언제든지 VOC 처리 현황을 조회하실 수 있습니다.
            </p>
            <p className="text-sm text-gray-600">
              담당자 배정 후 처리 진행 상황을 안내드리겠습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoToList}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
                'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50',
                'transition-colors'
              )}
            >
              목록으로
            </button>
            <button
              type="button"
              onClick={handleNewVoc}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
                'text-white bg-blue-600 hover:bg-blue-700',
                'transition-colors'
              )}
            >
              새 VOC 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
