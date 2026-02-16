'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { EmailComposeSheet } from '@/components/email/EmailComposeSheet';
import { ConfidenceIndicator } from '@/components/voc/ConfidenceIndicator';
import { VocStatusTimeline } from '@/components/voc/VocStatusTimeline';
import { useCategoryTree } from '@/hooks/useCategories';
import { useSimilarVocs } from '@/hooks/useSimilarVocs';
import { useVocStatusHistory } from '@/hooks/useVocStatusHistory';
import { useToast } from '@/hooks/useToast';
import { useVoc, useChangeVocStatus, useAddVocMemo, useUpdateVoc, useReanalyzeVoc } from '@/hooks/useVocs';
import { api, isConflictError } from '@/lib/api/client';
import type { Voc, VocStatus, VocMemo, RelatedLog } from '@/types';
import { isTerminalStatus, isLowConfidence, getAnalysisMethodLabel, getSentimentLabel, getSentimentColor } from '@/types';

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
  const { data: statusHistory } = useVocStatusHistory(vocId);
  const changeStatusMutation = useChangeVocStatus();
  const addMemoMutation = useAddVocMemo();
  const updateVocMutation = useUpdateVoc();
  const reanalyzeMutation = useReanalyzeVoc();
  const { toast } = useToast();

  const [newMemo, setNewMemo] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<number | ''>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | ''>('');
  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);
  const [applyingSolutionId, setApplyingSolutionId] = useState<number | null>(null);
  const [appliedSolutionIds, setAppliedSolutionIds] = useState<Set<number>>(new Set());

  const handleApplySolution = useCallback(async (similarVocId: number) => {
    setApplyingSolutionId(similarVocId);
    try {
      const response = await api.get<Voc>(`/vocs/${similarVocId}`);
      const similarVocDetail = response.data;
      const solution = similarVocDetail.aiAnalysis?.recommendation
        || similarVocDetail.processingNote
        || '';
      if (!solution) {
        toast({ title: '적용할 솔루션이 없습니다', description: '해당 VOC에 권장 조치 또는 처리 내용이 없습니다.', variant: 'warning' });
        return;
      }
      setNewMemo((prev) => prev ? `${prev}\n\n[유사 VOC #${similarVocDetail.ticketId} 솔루션]\n${solution}` : `[유사 VOC #${similarVocDetail.ticketId} 솔루션]\n${solution}`);
      setAppliedSolutionIds((prev) => new Set(prev).add(similarVocId));
      toast({ title: '솔루션이 적용되었습니다', description: '메모 필드에 솔루션이 추가되었습니다. 저장 버튼을 눌러 확정하세요.', variant: 'success' });
    } catch {
      toast({ title: '솔루션 적용 실패', description: '유사 VOC 정보를 불러올 수 없습니다.', variant: 'error' });
    } finally {
      setApplyingSolutionId(null);
    }
  }, [toast]);

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
      if (isConflictError(err)) {
        alert('다른 사용자가 이미 변경했습니다. 페이지를 새로고침합니다.');
        refetch();
      } else {
        alert('카테고리 변경 중 오류가 발생했습니다.');
      }
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
      if (isConflictError(err)) {
        alert('다른 사용자가 이미 변경했습니다. 페이지를 새로고침합니다.');
        refetch();
      } else {
        alert('VOC 반려 중 오류가 발생했습니다.');
      }
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
      if (isConflictError(err)) {
        alert('다른 사용자가 이미 변경했습니다. 페이지를 새로고침합니다.');
        refetch();
      } else {
        alert('VOC 완료 처리 중 오류가 발생했습니다.');
      }
    }
  };

  const handleReanalyze = async () => {
    if (!voc) return;
    if (!confirm('AI 분석을 다시 수행하시겠습니까? 기존 분석 결과가 초기화됩니다.')) return;

    try {
      await reanalyzeMutation.mutateAsync(voc.id);
      await refetch();
      toast({ title: '재분석이 시작되었습니다', description: '잠시 후 결과가 업데이트됩니다.', variant: 'success' });
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 409) {
        toast({ title: '이미 분석이 진행 중입니다', variant: 'warning' });
      } else {
        console.error('Failed to reanalyze:', err);
        toast({ title: '재분석 요청 실패', description: '오류가 발생했습니다.', variant: 'error' });
      }
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
  const isTerminal = isTerminalStatus(voc.status);

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
              <div className="flex items-center gap-2">
                <span className={`status-badge ${statusInfo.class}`}>
                  <span className="material-icons-outlined text-sm">{statusInfo.icon}</span>
                  {statusInfo.label}
                </span>
                {voc.sentiment && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSentimentColor(voc.sentiment)}`}>
                    {getSentimentLabel(voc.sentiment)}
                    {voc.sentimentConfidence != null && (
                      <span className="ml-1 opacity-75">
                        {Math.round(voc.sentimentConfidence * 100)}%
                      </span>
                    )}
                  </span>
                )}
              </div>
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
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
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
          {(analysis?.status === 'COMPLETED' || analysis?.status === 'FAILED') && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold border border-primary text-primary rounded hover:bg-primary/10 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReanalyze}
              disabled={reanalyzeMutation.isPending}
            >
              {reanalyzeMutation.isPending ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></span>
              ) : (
                <span className="material-icons-outlined text-sm">refresh</span>
              )}
              {reanalyzeMutation.isPending ? '요청 중...' : '재분석'}
            </button>
          )}
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
              {/* 신뢰도 - Enhanced with ConfidenceIndicator */}
              <div>
                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  분석 신뢰도
                </span>
                <ConfidenceIndicator
                  confidence={analysis.confidence || 0}
                  confidenceLevel={analysis.confidenceLevel}
                  analysisMethod={analysis.analysisMethod}
                  vectorMatchCount={analysis.vectorMatchCount}
                  confidenceDetails={analysis.confidenceDetails}
                  showMethodBadge={true}
                  showTooltip={true}
                  size="md"
                />
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
                <div
                  key={similar.id}
                  className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded border border-slate-200 dark:border-slate-700"
                >
                  <Link
                    href={`/voc/${similar.id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
                  >
                    <span className="material-icons-outlined text-primary text-sm flex-shrink-0">open_in_new</span>
                    <span className="text-sm font-mono flex-shrink-0">{similar.ticketId}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{similar.title}</span>
                  </Link>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span
                      className={`text-xs font-semibold ${
                        similar.similarity >= 0.8 ? 'text-success' : 'text-warning'
                      }`}
                    >
                      유사도 {similar.similarity.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySolution(similar.id)}
                      disabled={applyingSolutionId === similar.id || appliedSolutionIds.has(similar.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-primary text-primary rounded hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {applyingSolutionId === similar.id ? (
                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></span>
                      ) : appliedSolutionIds.has(similar.id) ? (
                        <span className="material-icons-outlined text-xs">check</span>
                      ) : (
                        <span className="material-icons-outlined text-xs">content_paste</span>
                      )}
                      {appliedSolutionIds.has(similar.id) ? '적용됨' : '솔루션 적용'}
                    </button>
                  </div>
                </div>
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

      {/* 5. 상태 변경 이력 타임라인 */}
      {statusHistory && statusHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="material-icons-outlined text-primary">timeline</span>
              상태 변경 이력
            </h2>
          </div>
          <div className="p-6">
            <VocStatusTimeline statusHistory={statusHistory} currentStatus={voc.status} />
          </div>
        </div>
      )}

      {/* 6. 담당자 메모 */}
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

      {/* 7. 변경 이력 */}
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
                      <span className="text-sm font-semibold">{memo.author?.name ?? '시스템'}</span>
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

      {/* 8. 하단 액션 버튼 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => setIsEmailSheetOpen(true)}
              className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-icons-outlined text-sm">email</span>
              이메일 발송
            </button>
            <button
              className="px-6 py-3 border border-danger text-danger font-semibold rounded hover:bg-danger/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={handleReject}
              disabled={changeStatusMutation.isPending || isTerminal}
              title={isTerminal ? '완료/반려된 VOC는 상태를 변경할 수 없습니다' : undefined}
              aria-disabled={changeStatusMutation.isPending || isTerminal}
            >
              <span className="material-icons-outlined text-sm">block</span>
              반려
            </button>
            <button
              className="px-6 py-3 bg-success text-white font-semibold rounded hover:bg-success/90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
              onClick={handleComplete}
              disabled={changeStatusMutation.isPending || isTerminal}
              title={isTerminal ? '완료/반려된 VOC는 상태를 변경할 수 없습니다' : undefined}
              aria-disabled={changeStatusMutation.isPending || isTerminal}
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

      {/* Email Compose Sheet - 조건부 렌더링으로 불필요한 API 호출 방지 */}
      {isEmailSheetOpen && (
        <EmailComposeSheet
          vocId={voc.id}
          open={isEmailSheetOpen}
          onOpenChange={setIsEmailSheetOpen}
        />
      )}
    </div>
  );
}
