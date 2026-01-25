'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAddVocMemo, useDeleteVocMemo, useSaveMemoDraft } from '@/hooks/useVocMemos';
import { cn } from '@/lib/utils';
import type { VocMemo } from '@/types';

interface VocMemoListProps {
  vocId: number;
  memos: VocMemo[];
  currentUserId?: number;
}

export function VocMemoList({ vocId, memos, currentUserId }: VocMemoListProps) {
  const [newMemo, setNewMemo] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addMemo = useAddVocMemo();
  const deleteMemo = useDeleteVocMemo();
  const saveMemoDraft = useSaveMemoDraft();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newMemo.trim()) {
      setError('메모 내용을 입력해주세요');
      return;
    }

    if (newMemo.length > 1000) {
      setError('메모는 최대 1,000자까지 입력 가능합니다');
      return;
    }

    try {
      await addMemo.mutateAsync({
        vocId,
        data: {
          content: newMemo,
          isInternal,
        },
      });
      setNewMemo('');
    } catch (err) {
      setError('메모 저장에 실패했습니다');
      console.error('Failed to add memo:', err);
    }
  };

  const handleSaveDraft = async () => {
    if (!newMemo.trim()) return;

    try {
      await saveMemoDraft.mutateAsync({
        vocId,
        content: newMemo,
      });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleDelete = async (memoId: number) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;

    try {
      await deleteMemo.mutateAsync({
        vocId,
        memoId,
      });
    } catch (err) {
      console.error('Failed to delete memo:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">담당자 메모</h2>

      {/* 메모 목록 */}
      {memos.length > 0 && (
        <div className="mb-6 space-y-4">
          {memos.map((memo) => (
            <div
              key={memo.id}
              className={cn(
                'p-4 rounded-lg border',
                memo.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{memo.author.name}</span>
                  {memo.isInternal && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded">
                      내부 메모
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {format(new Date(memo.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </span>
                  {currentUserId === memo.author.id && (
                    <button
                      type="button"
                      onClick={() => handleDelete(memo.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                      aria-label="메모 삭제"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{memo.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 메모 추가 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="memo-content" className="block text-sm font-medium text-gray-700 mb-2">
            새 메모 작성
          </label>
          <textarea
            id="memo-content"
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            rows={4}
            maxLength={1000}
            className={cn(
              'w-full px-3 py-2 border rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="메모 내용을 입력하세요 (최대 1,000자)"
            aria-invalid={!!error}
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">내부 메모</span>
              </label>
            </div>
            <span
              className={cn(
                'text-xs',
                newMemo.length > 1000 ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {newMemo.length} / 1,000
            </span>
          </div>
          {error && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saveMemoDraft.isPending || !newMemo.trim()}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium',
              'bg-gray-200 text-gray-700 hover:bg-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saveMemoDraft.isPending ? '저장 중...' : '임시저장'}
          </button>
          <button
            type="submit"
            disabled={addMemo.isPending || !newMemo.trim()}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium',
              'bg-blue-600 text-white hover:bg-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {addMemo.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
