'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { VocDetail } from '@/components/voc/VocDetail';
import { VocMemoList } from '@/components/voc/VocMemoList';
import { VocStatusHistory } from '@/components/voc/VocStatusHistory';
import { VocAnalysisPanel } from '@/components/voc/VocAnalysisPanel';
import {
  useVocDetail,
  useVocHistory,
  useCompleteVoc,
  useRejectVoc,
} from '@/hooks/useVocDetail';
import { useVocAnalysis } from '@/hooks/useVocAnalysis';
import { useAuthStore } from '@/store/authStore';

export default function VocDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vocId = params.id ? parseInt(params.id as string, 10) : null;
  const currentUser = useAuthStore((state) => state.user);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const { data: voc, isLoading, error } = useVocDetail(vocId);
  const { data: history, isLoading: isLoadingHistory } = useVocHistory(vocId);
  const { data: analysis, isLoading: isLoadingAnalysis, error: analysisError } = useVocAnalysis(vocId);

  const completeVoc = useCompleteVoc();
  const rejectVoc = useRejectVoc();

  const handleComplete = () => {
    setShowCompleteModal(true);
  };

  const confirmComplete = async () => {
    if (!vocId) return;

    try {
      await completeVoc.mutateAsync(vocId);
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Failed to complete VOC:', err);
      alert('완료 처리에 실패했습니다');
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
    setRejectReason('');
    setRejectError(null);
  };

  const confirmReject = async () => {
    if (!vocId) return;

    if (!rejectReason.trim()) {
      setRejectError('반려 사유를 입력해주세요');
      return;
    }

    if (rejectReason.length < 10) {
      setRejectError('반려 사유를 최소 10자 이상 입력해주세요');
      return;
    }

    try {
      await rejectVoc.mutateAsync({ vocId, reason: rejectReason });
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject VOC:', err);
      alert('반려 처리에 실패했습니다');
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-600">VOC 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !voc) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">VOC를 찾을 수 없습니다</h3>
                <p className="mt-1 text-sm text-red-700">
                  요청하신 VOC 정보를 불러올 수 없습니다. 이전 페이지로 돌아가주세요.
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  뒤로가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
              aria-label="뒤로가기"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              뒤로가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">VOC 상세</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - VOC Detail and Memos */}
          <div className="lg:col-span-2 space-y-6">
            <VocDetail
              voc={voc}
              onStatusChange={(status) => console.log('Status changed:', status)}
              onComplete={handleComplete}
              onReject={handleReject}
            />

            <VocMemoList
              vocId={voc.id}
              memos={voc.memos || []}
              currentUserId={currentUser?.id}
            />
          </div>

          {/* Right Column - Analysis and History */}
          <div className="space-y-6">
            <VocAnalysisPanel
              analysis={analysis}
              isLoading={isLoadingAnalysis}
              error={analysisError}
            />

            {!isLoadingHistory && history && <VocStatusHistory history={history} />}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">VOC 반려</h3>
            <p className="text-sm text-gray-600 mb-4">
              VOC를 반려하시겠습니까? 반려 사유를 입력해주세요.
            </p>
            <div className="mb-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">
                반려 사유 (최소 10자)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError(null);
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="반려 사유를 입력하세요"
                aria-invalid={!!rejectError}
              />
              {rejectError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {rejectError}
                </p>
              )}
            </div>
            <div className="flex space-x-2 justify-end">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={rejectVoc.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {rejectVoc.isPending ? '처리 중...' : '반려'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCompleteModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">VOC 완료 처리</h3>
            <p className="text-sm text-gray-600 mb-6">
              VOC를 완료 처리하시겠습니까? 완료 처리 후 상태가 변경됩니다.
            </p>
            <div className="flex space-x-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmComplete}
                disabled={completeVoc.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {completeVoc.isPending ? '처리 중...' : '완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
