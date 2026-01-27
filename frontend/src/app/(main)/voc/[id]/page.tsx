'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { VocPriorityBadge } from '@/components/voc/VocPriorityBadge';
import { VocStatusBadge } from '@/components/voc/VocStatusBadge';
import { useUsers } from '@/hooks/useUsers';
import { useVoc, useChangeVocStatus, useAddVocMemo, useAssignVoc } from '@/hooks/useVocs';
import type { VocStatus, VocMemo } from '@/types';

const STATUS_OPTIONS: { value: VocStatus; label: string }[] = [
  { value: 'RECEIVED', label: '접수' },
  { value: 'ASSIGNED', label: '배정' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'PENDING', label: '보류' },
  { value: 'RESOLVED', label: '완료' },
  { value: 'CLOSED', label: '종료' },
  { value: 'REJECTED', label: '반려' },
];

export default function VocDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vocId = Number(params.id);

  const { data: voc, isLoading, error } = useVoc(vocId);
  const { data: usersData } = useUsers({ page: 0, size: 100 });
  const changeStatusMutation = useChangeVocStatus();
  const addMemoMutation = useAddVocMemo();
  const assignMutation = useAssignVoc();

  const [newMemo, setNewMemo] = useState('');
  const [isInternalMemo, setIsInternalMemo] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<VocStatus | ''>('');
  const [processingNote, setProcessingNote] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<number | ''>('');

  const users = usersData?.data?.content ?? [];

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

  const handleStatusChange = async () => {
    if (!selectedStatus || !voc) return;

    try {
      await changeStatusMutation.mutateAsync({
        vocId: voc.id,
        data: {
          status: selectedStatus,
          processingNote: processingNote || undefined,
        },
      });
      setSelectedStatus('');
      setProcessingNote('');
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim() || !voc) return;

    try {
      await addMemoMutation.mutateAsync({
        vocId: voc.id,
        data: {
          content: newMemo,
          isInternal: isInternalMemo,
        },
      });
      setNewMemo('');
      setIsInternalMemo(false);
    } catch (err) {
      console.error('Failed to add memo:', err);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee || !voc) return;

    try {
      await assignMutation.mutateAsync({
        vocId: voc.id,
        data: {
          assigneeId: Number(selectedAssignee),
        },
      });
      setSelectedAssignee('');
    } catch (err) {
      console.error('Failed to assign:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !voc) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-700 mb-2">VOC를 찾을 수 없습니다</h2>
          <p className="text-red-600 mb-4">요청하신 VOC가 존재하지 않거나 접근 권한이 없습니다.</p>
          <button
            onClick={() => router.push('/voc/table')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/voc/table" className="hover:text-blue-600">
            VOC 목록
          </Link>
          <span>/</span>
          <span>{voc.ticketId}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{voc.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <VocStatusBadge status={voc.status} />
              <VocPriorityBadge priority={voc.priority} />
              <span className="text-sm text-gray-500">티켓 ID: {voc.ticketId}</span>
            </div>
          </div>
          <Link
            href={`/voc/${voc.id}/similar`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            유사 VOC 찾기
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* VOC Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">VOC 내용</h2>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{voc.content}</p>
            </div>
          </div>

          {/* Attachments */}
          {voc.attachments && voc.attachments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">첨부파일</h2>
              <ul className="space-y-2">
                {voc.attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <a
                      href={attachment.downloadUrl}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {attachment.originalFileName}
                    </a>
                    <span className="text-xs text-gray-400">
                      ({(attachment.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Memos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">메모 및 처리 이력</h2>

            {/* Memo List */}
            <div className="space-y-4 mb-6">
              {voc.memos && voc.memos.length > 0 ? (
                voc.memos.map((memo: VocMemo) => (
                  <div
                    key={memo.id}
                    className={`p-4 rounded-lg ${
                      memo.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{memo.author.name}</span>
                        {memo.isInternal && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">
                            내부 메모
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(memo.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{memo.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">메모가 없습니다.</p>
              )}
            </div>

            {/* Add Memo Form */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">메모 추가</h3>
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternalMemo}
                    onChange={(e) => setIsInternalMemo(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-600">내부 메모 (고객에게 비공개)</span>
                </label>
                <button
                  onClick={handleAddMemo}
                  disabled={!newMemo.trim() || addMemoMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {addMemoMutation.isPending ? '저장 중...' : '메모 추가'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 정보</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">이름</dt>
                <dd className="text-sm text-gray-900">{voc.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">이메일</dt>
                <dd className="text-sm text-gray-900">{voc.customerEmail}</dd>
              </div>
              {voc.customerPhone && (
                <div>
                  <dt className="text-xs text-gray-500">전화번호</dt>
                  <dd className="text-sm text-gray-900">{voc.customerPhone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* VOC Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">VOC 정보</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">카테고리</dt>
                <dd className="text-sm text-gray-900">{voc.category?.name || '미분류'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">채널</dt>
                <dd className="text-sm text-gray-900">{voc.channel}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">담당자</dt>
                <dd className="text-sm text-gray-900">{voc.assignee?.name || '미배정'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">등록일</dt>
                <dd className="text-sm text-gray-900">{formatDateTime(voc.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">최종 수정</dt>
                <dd className="text-sm text-gray-900">{formatDateTime(voc.updatedAt)}</dd>
              </div>
              {voc.resolvedAt && (
                <div>
                  <dt className="text-xs text-gray-500">처리 완료일</dt>
                  <dd className="text-sm text-gray-900">{formatDateTime(voc.resolvedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">처리</h2>

            {/* Status Change */}
            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium text-gray-700">상태 변경</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as VocStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">상태 선택</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedStatus && (
                <textarea
                  value={processingNote}
                  onChange={(e) => setProcessingNote(e.target.value)}
                  placeholder="처리 내용을 입력하세요 (선택)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              )}
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus || changeStatusMutation.isPending}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {changeStatusMutation.isPending ? '변경 중...' : '상태 변경'}
              </button>
            </div>

            {/* Assignee Change */}
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <label className="text-sm font-medium text-gray-700">담당자 배정</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">담당자 선택</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={!selectedAssignee || assignMutation.isPending}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {assignMutation.isPending ? '배정 중...' : '담당자 배정'}
              </button>
            </div>
          </div>

          {/* AI Analysis (if available) */}
          {voc.aiAnalysis && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI 분석</h2>
              <dl className="space-y-3">
                {voc.aiAnalysis.summary && (
                  <div>
                    <dt className="text-xs text-gray-500">요약</dt>
                    <dd className="text-sm text-gray-900">{voc.aiAnalysis.summary}</dd>
                  </div>
                )}
                {voc.aiAnalysis.sentiment && (
                  <div>
                    <dt className="text-xs text-gray-500">감성 분석</dt>
                    <dd className="text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          voc.aiAnalysis.sentiment === 'POSITIVE'
                            ? 'bg-green-100 text-green-700'
                            : voc.aiAnalysis.sentiment === 'NEGATIVE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {voc.aiAnalysis.sentiment === 'POSITIVE'
                          ? '긍정'
                          : voc.aiAnalysis.sentiment === 'NEGATIVE'
                          ? '부정'
                          : '중립'}
                      </span>
                    </dd>
                  </div>
                )}
                {voc.aiAnalysis.keywords && voc.aiAnalysis.keywords.length > 0 && (
                  <div>
                    <dt className="text-xs text-gray-500">키워드</dt>
                    <dd className="flex flex-wrap gap-1 mt-1">
                      {voc.aiAnalysis.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
