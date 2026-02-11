'use client';

import { useState, useEffect, useCallback } from 'react';

import { useVocFormViewModel } from '@/hooks/useVocFormViewModel';
import { cn } from '@/lib/utils';
import type { VocPriority, Voc } from '@/types';
import { priorityLabels } from '@/types/vocForm';

import { CategorySelect } from './CategorySelect';
import { FileUpload } from './FileUpload';
import { VocSuccessModal } from './VocSuccessModal';


function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * @description VocForm component for VOC input
 * Uses MVVM pattern with useVocFormViewModel hook
 */
export function VocForm() {
  const [successTicketId, setSuccessTicketId] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { form, isSubmitting, error, handleSubmit, reset, hasDraft, draftSavedAt, restoreDraft, clearDraft } = useVocFormViewModel({
    onSuccess: (voc: Voc) => {
      setSuccessTicketId(voc.ticketId);
      setShowSuccessModal(true);
    },
  });

  const [showDraftDialog, setShowDraftDialog] = useState(hasDraft);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const files = watch('files') || [];

  const handleNewVoc = () => {
    setShowSuccessModal(false);
    setSuccessTicketId('');
  };

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftDialog(false);
  }, [clearDraft]);

  // Escape key handler for draft dialog accessibility
  useEffect(() => {
    if (!showDraftDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDiscardDraft();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDraftDialog, handleDiscardDraft]);

  const priorityOptions: VocPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  return (
    <>
      {/* 임시저장 복원 다이얼로그 */}
      {showDraftDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-dialog-title"
            className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4"
          >
            <h3 id="draft-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
              임시저장된 내용
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              이전에 작성 중이던 내용이 있습니다. 불러오시겠습니까?
            </p>
            {draftSavedAt && (
              <p className="text-xs text-gray-400 mb-4">
                저장 시간: {formatTime(draftSavedAt)}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                새로 작성
              </button>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                불러오기
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 전역 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-sm text-red-700">
              {(error as any)?.response?.data?.error?.message || 'VOC 등록에 실패했습니다'}
            </p>
          </div>
        )}

        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            placeholder="제목을 입력하세요 (2~200자)"
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              errors.title
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200'
            )}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* 내용 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            {...register('content')}
            rows={8}
            placeholder="내용을 입력하세요 (최소 10자)"
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none',
              errors.content
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200'
            )}
            aria-invalid={!!errors.content}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* 카테고리 선택 */}
        <CategorySelect
          value={watch('categoryId') ?? null}
          error={errors.categoryId?.message}
          register={register}
          setValue={setValue}
          watch={watch}
        />

        {/* 우선순위 */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            우선순위 <span className="text-red-500">*</span>
          </label>
          <select
            id="priority"
            {...register('priority')}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              errors.priority
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200'
            )}
            aria-invalid={!!errors.priority}
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.priority.message}
            </p>
          )}
        </div>

        {/* 고객 정보 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">고객 정보</h3>

          <div className="space-y-4">
            {/* 고객명 */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                고객명
              </label>
              <input
                id="customerName"
                type="text"
                {...register('customerName')}
                placeholder="고객명을 입력하세요"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                  errors.customerName
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'
                )}
                aria-invalid={!!errors.customerName}
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            {/* 고객 이메일 */}
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="이메일을 입력하세요 (예: customer@example.com)"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                  errors.customerEmail
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200'
                )}
                aria-invalid={!!errors.customerEmail}
              />
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.customerEmail.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 파일 첨부 */}
        <div className="border-t border-gray-200 pt-6">
          <FileUpload files={files} setValue={setValue} />
        </div>

        {/* 제출 버튼 + 임시저장 상태 */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-200">
          {/* 임시저장 상태 표시 */}
          <div className="text-xs text-muted-foreground">
            {draftSavedAt && (
              <span>&#10003; 임시저장됨 {formatTime(draftSavedAt)}</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              disabled={isSubmitting}
              className={cn(
                'px-6 py-2.5 text-sm font-medium rounded-lg border transition-colors',
                isSubmitting
                  ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              )}
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors',
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {isSubmitting ? '등록 중...' : 'VOC 등록'}
            </button>
          </div>
        </div>
      </form>

      {/* 성공 모달 */}
      <VocSuccessModal
        isOpen={showSuccessModal}
        ticketId={successTicketId}
        onClose={() => setShowSuccessModal(false)}
        onNewVoc={handleNewVoc}
      />
    </>
  );
}
