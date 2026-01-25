'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { VocStatusBadge } from './VocStatusBadge';
import { VocPriorityBadge } from './VocPriorityBadge';
import { CategorySelect } from './CategorySelect';
import { useUpdateVocCategory, useDownloadAttachment } from '@/hooks/useVocDetail';
import { cn } from '@/lib/utils';
import type { Voc } from '@/types';

interface VocDetailProps {
  voc: Voc;
  onStatusChange: (status: string) => void;
  onComplete: () => void;
  onReject: () => void;
}

export function VocDetail({ voc, onStatusChange, onComplete, onReject }: VocDetailProps) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(
    voc.category?.id
  );

  const updateCategory = useUpdateVocCategory();
  const downloadAttachment = useDownloadAttachment();

  const handleSaveCategory = async () => {
    if (!selectedCategoryId) return;

    try {
      await updateCategory.mutateAsync({
        vocId: voc.id,
        categoryId: selectedCategoryId,
      });
      setIsEditingCategory(false);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const result = await downloadAttachment.mutateAsync({
        vocId: voc.id,
        fileId,
      });

      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const canComplete = voc.status === 'IN_PROGRESS';
  const canReject = voc.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      {/* VOC 기본 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">VOC 기본 정보</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Ticket ID</label>
              <p className="mt-1 text-sm text-gray-900">{voc.ticketId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">상태</label>
              <div className="mt-1">
                <VocStatusBadge status={voc.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">접수일시</label>
              <p className="mt-1 text-sm text-gray-900">
                {format(new Date(voc.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">우선순위</label>
              <div className="mt-1">
                <VocPriorityBadge priority={voc.priority} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">고객 이메일</label>
            <p className="mt-1 text-sm text-gray-900">{voc.customerEmail}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">고객명</label>
            <p className="mt-1 text-sm text-gray-900">{voc.customerName}</p>
          </div>

          {voc.customerPhone && (
            <div>
              <label className="text-sm font-medium text-gray-500">연락처</label>
              <p className="mt-1 text-sm text-gray-900">{voc.customerPhone}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-500">제목</label>
            <p className="mt-1 text-sm text-gray-900">{voc.title}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">내용</label>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{voc.content}</p>
          </div>

          {voc.assignee && (
            <div>
              <label className="text-sm font-medium text-gray-500">담당자</label>
              <p className="mt-1 text-sm text-gray-900">
                {voc.assignee.name} ({voc.assignee.username})
              </p>
            </div>
          )}

          {voc.attachments && voc.attachments.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">첨부파일</label>
              <div className="mt-2 space-y-2">
                {voc.attachments.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => handleDownload(file.id, file.originalFileName)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                    aria-label={`다운로드 ${file.originalFileName}`}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {file.originalFileName}
                    <span className="ml-2 text-gray-500">
                      ({Math.round(file.fileSize / 1024)} KB)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 수정 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">카테고리</h2>
          {!isEditingCategory && (
            <button
              type="button"
              onClick={() => setIsEditingCategory(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              수정
            </button>
          )}
        </div>

        {isEditingCategory ? (
          <div className="space-y-4">
            <CategorySelect
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              required
            />
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={updateCategory.isPending || !selectedCategoryId}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium',
                  'bg-blue-600 text-white hover:bg-blue-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {updateCategory.isPending ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingCategory(false);
                  setSelectedCategoryId(voc.category?.id);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-900">
              {voc.category?.name || voc.suggestedCategory?.name || '미분류'}
            </p>
            {voc.suggestedCategory && (
              <p className="mt-1 text-xs text-gray-500">
                AI 추천: {voc.suggestedCategory.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex space-x-4">
        {canReject && (
          <button
            type="button"
            onClick={onReject}
            className="px-6 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            반려
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={onComplete}
            className="px-6 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
          >
            완료 처리
          </button>
        )}
      </div>
    </div>
  );
}
