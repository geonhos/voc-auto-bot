'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useCategoryTree } from '@/hooks/useCategories';
import { useSimilarVocs } from '@/hooks/useSimilarVocs';
import { useVoc, useChangeVocStatus, useAddVocMemo, useUpdateVoc } from '@/hooks/useVocs';
import type { VocStatus, VocMemo, AiAnalysis, RelatedLog } from '@/types';

const STATUS_MAP: Record<VocStatus, { label: string; icon: string; class: string }> = {
  NEW: { label: '접수', icon: 'inbox', class: 'status-received' },
  IN_PROGRESS: { label: '처리중', icon: 'sync', class: 'status-processing' },
  PENDING: { label: '보류', icon: 'pause_circle', class: 'status-analyzing' },
  RESOLVED: { label: '완료', icon: 'check_circle', class: 'status-completed' },
  CLOSED: { label: '종료', icon: 'archive', class: 'status-completed' },
  REJECTED: { label: '반려', icon: 'block', class: 'status-rejected' },
};

export default function VocDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vocId = Number(params.id);

  const { data: voc, isLoading, error, refetch } = useVoc(vocId);
  const { data: categoryTree } = useCategoryTree();
  const { data: similarVocs } = useSimilarVocs(vocId, { limit: 5, enabled: !!voc });
  const changeStatusMutation = useChangeVocStatus();
  const addMemoMutation = useAddVocMemo();
  const updateVocMutation = useUpdateVoc();

  const [newMemo, setNewMemo] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<number | ''>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | ''>('');

  // 분석 진행 중이면 주기적으로 새로고침
  useEffect(() => {
    if (voc?.aiAnalysis?.status === 'PENDING' || voc?.aiAnalysis?.status === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        refetch();
      }, 3000); // 3초마다 새로고침
      return () => clearInterval(interval);
    }
    return undefined;
  }, [voc?.aiAnalysis?.status, refetch]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleSaveMemo = async () => {
    if (!newMemo.trim() || !voc) return;

    try {
      await addMemoMutation.mutateAsync({
        vocId: voc.id,
        data: {
          content: newMemo,
          isInternal: true,
        },
      });
      setNewMemo('');
      alert('메모가 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error('Failed to add memo:', err);
      alert('메모 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveCategory = async () => {
    if (!voc || !selectedSubCategory) return;

    try {
      await updateVocMutation.mutateAsync({
        vocId: voc.id,
        data: {
          title: voc.title,
          content: voc.content,
          categoryId: Number(selectedSubCategory),
        },
      });
      alert('카테고리가 성공적으로 변경되었습니다.');
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('카테고리 변경 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async () => {
    if (!voc) return;
    if (!confirm('이 VOC를 반려하시겠습니까?')) return;

    try {
      await changeStatusMutation.mutateAsync({
        vocId: voc.id,
        data: {
          status: 'REJECTED',
        },
      });
      alert('VOC가 반려되었습니다.');
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('VOC 반려 중 오류가 발생했습니다.');
    }
  };

  const handleComplete = async () => {
    if (!voc) return;
    if (!confirm('이 VOC를 완료 처리하시겠습니까?')) return;

    try {
      await changeStatusMutation.mutateAsync({
        vocId: voc.id,
        data: {
          status: 'RESOLVED',
        },
      });
      alert('VOC가 완료 처리되었습니다.');
    } catch (err) {
      console.error('Failed to complete:', err);
      alert('VOC 완료 처리 중 오류가 발생했습니다.');
    }
  };

  // Filter main categories (those with children or type === 'MAIN')
  const mainCategories = categoryTree?.filter((cat) =>
    cat.children && cat.children.length > 0
  ) || [];

  // Get subcategories based on selected main category
  const subCategories =
    categoryTree?.find((cat) => cat.id === selectedMainCategory)?.children || [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !voc) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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

  const statusInfo = STATUS_MAP[voc.status];
  const analysis = voc.aiAnalysis;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">VOC 상세</h1>
        <p className="text-slate-500 dark:text-slate-400">
          VOC 처리 담당자를 위한 상세 정보 및 분석 결과를 확인하세요.
        </p>
      </div>

      {/* 1. VOC 기본 정보 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons-outlined text-primary">receipt_long</span>
            VOC 기본 정보
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Ticket ID
              </span>
              <p className="text-base font-mono">{voc.ticketId}</p>
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                상태
              </span>
              <span className={`status-badge ${statusInfo.class}`}>
                <span className="material-icons-outlined text-sm">{statusInfo.icon}</span>
                {statusInfo.label}
              </span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                접수일시
              </span>
              <p className="text-base">{formatDateTime(voc.createdAt)}</p>
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                최종 사용자 이메일
              </span>
              <p className="text-base">{voc.customerEmail}</p>
            </div>
          </div>
          <div>
            <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              제목
            </span>
            <p className="text-base font-medium">{voc.title}</p>
          </div>
          <div>
            <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              내용
            </span>
            <p className="text-base leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700">
              {voc.content}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                발생 시간
              </span>
              <p className="text-base">{formatDateTime(voc.createdAt)}</p>
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                계정 ID
              </span>
              <p className="text-base">{voc.customerName}</p>
            </div>
          </div>
          {voc.attachments && voc.attachments.length > 0 && (
            <div>
              <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                첨부 파일
              </span>
              <div className="space-y-2">
                {voc.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="material-icons-outlined text-primary text-xl flex-shrink-0">
                        {attachment.mimeType.startsWith('image/') ? 'image' : 'description'}
                      </span>
                      <span className="text-sm truncate">{attachment.originalFileName}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                    <span className="material-icons-outlined text-slate-400 group-hover:text-primary transition-colors">
                      download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. AI 분석 결과 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons-outlined text-primary">psychology</span>
            AI 분석 결과
            {analysis?.status === 'PENDING' || analysis?.status === 'IN_PROGRESS' ? (
              <span className="ml-2 text-sm font-normal text-warning flex items-center gap-1">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-warning"></span>
                분석 중...
              </span>
            ) : null}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {!analysis ? (
            <p className="text-sm text-slate-500">분석 정보가 없습니다.</p>
          ) : analysis.status === 'PENDING' || analysis.status === 'IN_PROGRESS' ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">AI가 로그를 분석하고 있습니다...</p>
                <p className="text-sm text-slate-500 mt-1">잠시만 기다려 주세요.</p>
              </div>
            </div>
          ) : analysis.status === 'FAILED' ? (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-danger mb-2">
                <span className="material-icons-outlined">error</span>
                <span className="font-semibold">분석 실패</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {analysis.errorMessage || '알 수 없는 오류가 발생했습니다.'}
              </p>
            </div>
          ) : (
            <>
              {/* 신뢰도 */}
              <div>
                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  분석 신뢰도
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (analysis.confidence || 0) >= 0.7
                          ? 'bg-success'
                          : (analysis.confidence || 0) >= 0.4
                          ? 'bg-warning'
                          : 'bg-danger'
                      }`}
                      style={{ width: `${(analysis.confidence || 0) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold min-w-[50px] text-right">
                    {Math.round((analysis.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>

              {/* 분석 요약 */}
              {analysis.summary && (
                <div>
                  <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    분석 요약
                  </span>
                  <div className="text-base leading-relaxed bg-info/5 dark:bg-info/10 p-4 rounded border border-info/20">
                    <p className="whitespace-pre-wrap">{analysis.summary}</p>
                  </div>
                </div>
              )}

              {/* 예상 원인 */}
              {analysis.possibleCauses && analysis.possibleCauses.length > 0 && (
                <div>
                  <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    예상 원인
                  </span>
                  <ul className="space-y-2">
                    {analysis.possibleCauses.map((cause, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-warning/5 dark:bg-warning/10 p-3 rounded border border-warning/20"
                      >
                        <span className="text-warning font-bold">{idx + 1}.</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 권장 조치 */}
              {analysis.recommendation && (
                <div>
                  <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    권장 조치
                  </span>
                  <div className="bg-success/5 dark:bg-success/10 p-4 rounded border border-success/20">
                    <p className="whitespace-pre-wrap">{analysis.recommendation}</p>
                  </div>
                </div>
              )}

              {/* 키워드 */}
              {analysis.keywords && analysis.keywords.length > 0 && (
                <div>
                  <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    키워드
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 관련 로그 */}
              {analysis.relatedLogs && analysis.relatedLogs.length > 0 && (
                <div>
                  <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    관련 로그 ({analysis.relatedLogs.length}건)
                  </span>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {analysis.relatedLogs.map((log: RelatedLog, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              log.logLevel === 'ERROR'
                                ? 'bg-danger/20 text-danger'
                                : log.logLevel === 'WARN'
                                ? 'bg-warning/20 text-warning'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {log.logLevel}
                          </span>
                          <span className="text-xs text-slate-500">{log.serviceName}</span>
                          <span className="text-xs text-slate-400">{log.timestamp}</span>
                          <span className="ml-auto text-xs text-primary font-semibold">
                            유사도: {Math.round(log.relevanceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                          {log.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 분석 시간 */}
              {analysis.analyzedAt && (
                <div className="text-right text-xs text-slate-400">
                  분석 완료: {formatDateTime(analysis.analyzedAt)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. 유사 VOC */}
      {similarVocs && similarVocs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-icons-outlined text-primary">content_copy</span>
              유사 VOC ({similarVocs.length}건)
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {similarVocs.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/voc/${similar.id}`}
                  className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-icons-outlined text-primary text-sm">open_in_new</span>
                    <span className="text-sm font-mono">{similar.ticketId}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{similar.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        similar.similarity >= 0.8 ? 'text-success' : 'text-warning'
                      }`}
                    >
                      유사도 {similar.similarity.toFixed(2)}
                    </span>
                    <span className="material-icons-outlined text-slate-400 text-sm">chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. 카테고리 수정 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons-outlined text-primary">category</span>
            카테고리 수정
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="mainCategory">
                대분류
              </label>
              <select
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                id="mainCategory"
                name="mainCategory"
                value={selectedMainCategory}
                onChange={(e) => {
                  setSelectedMainCategory(e.target.value ? Number(e.target.value) : '');
                  setSelectedSubCategory('');
                }}
              >
                <option value="">대분류 선택</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" htmlFor="subCategory">
                중분류
              </label>
              <select
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                id="subCategory"
                name="subCategory"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value ? Number(e.target.value) : '')}
                disabled={!selectedMainCategory}
              >
                <option value="">중분류 선택</option>
                {subCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="px-6 py-2 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
            type="button"
            onClick={handleSaveCategory}
            disabled={!selectedSubCategory || updateVocMutation.isPending}
          >
            {updateVocMutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 5. 담당자 메모 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons-outlined text-primary">note_alt</span>
            담당자 메모
          </h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" htmlFor="memo">
              메모 내용 (최대 1000자)
            </label>
            <textarea
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              id="memo"
              name="memo"
              placeholder="처리 내용, 조치 사항, 특이사항 등을 메모하세요"
              rows={5}
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              maxLength={1000}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {newMemo.length} / 1,000자
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="px-6 py-2 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
              type="button"
              onClick={handleSaveMemo}
              disabled={!newMemo.trim() || addMemoMutation.isPending}
            >
              {addMemoMutation.isPending ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 6. 변경 이력 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons-outlined text-primary">history</span>
            변경 이력
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {voc.memos && voc.memos.length > 0 ? (
              voc.memos.map((memo: VocMemo) => (
                <div
                  key={memo.id}
                  className="flex gap-4 pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                >
                  <div className="flex-shrink-0 w-40 text-sm text-slate-500 dark:text-slate-400">
                    <div className="font-medium">{formatDate(memo.createdAt)}</div>
                    <div className="text-xs">{formatTime(memo.createdAt)}</div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{memo.author.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                        담당자
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="whitespace-pre-wrap">{memo.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">변경 이력이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 7. 하단 액션 버튼 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              className="px-6 py-3 border border-danger text-danger font-semibold rounded hover:bg-danger/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={handleReject}
              disabled={changeStatusMutation.isPending}
            >
              <span className="material-icons-outlined text-sm">block</span>
              반려
            </button>
            <Link
              href={`/email/compose?vocId=${voc.id}`}
              className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-icons-outlined text-sm">email</span>
              이메일 발송
            </Link>
            <button
              className="px-6 py-3 bg-success text-white font-semibold rounded hover:bg-success/90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={handleComplete}
              disabled={changeStatusMutation.isPending}
            >
              <span className="material-icons-outlined text-sm">check_circle</span>
              완료 처리
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-info/10 dark:bg-info/5 border border-info/20 rounded-lg flex gap-3">
        <span className="material-icons-outlined text-info">info</span>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          VOC 처리 완료 후에는 최종 사용자에게 자동으로 알림이 발송됩니다. 유사 VOC를 참고하여
          신속하고 정확한 처리를 진행해 주시기 바랍니다.
        </p>
      </div>

    </div>
  );
}
