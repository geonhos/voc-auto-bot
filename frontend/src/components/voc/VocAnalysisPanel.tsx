'use client';

import { VocStatusBadge } from './VocStatusBadge';
import { cn } from '@/lib/utils';
import type { VocAnalysisResult } from '@/types';

interface VocAnalysisPanelProps {
  analysis: VocAnalysisResult | null | undefined;
  isLoading?: boolean;
  error?: Error | null;
}

export function VocAnalysisPanel({ analysis, isLoading, error }: VocAnalysisPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">AI 분석 결과</h2>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-600">AI 분석이 진행 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">AI 분석 결과</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3"
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
              <h3 className="text-sm font-medium text-red-800">AI 분석에 실패했습니다</h3>
              <p className="mt-1 text-sm text-red-700">
                관리자에게 문의하세요. 에러: {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">AI 분석 결과</h2>
        <p className="text-sm text-gray-500">분석 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI 분석 결과 섹션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">AI 분석 결과</h2>
        <div className="space-y-4">
          {analysis.category && (
            <div>
              <label className="text-sm font-medium text-gray-500">자동 분류 카테고리</label>
              <p className="mt-1 text-sm text-gray-900">
                {analysis.category.main} &gt; {analysis.category.sub}
              </p>
            </div>
          )}

          {analysis.responseGuide && (
            <div>
              <label className="text-sm font-medium text-gray-500">추천 응대 가이드</label>
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysis.responseGuide}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 유사 VOC 섹션 */}
      {analysis.similarVocs && analysis.similarVocs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            유사 VOC ({analysis.similarVocs.length}건)
          </h2>
          <div className="space-y-2">
            {analysis.similarVocs.map((similarVoc) => (
              <a
                key={similarVoc.id}
                href={`/voc/${similarVoc.id}`}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  'border border-gray-200 hover:bg-gray-50',
                  'transition-colors duration-150'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-blue-600">
                    {similarVoc.ticketId}
                  </span>
                  <span className="text-sm text-gray-700">{similarVoc.title}</span>
                  <VocStatusBadge status={similarVoc.status} />
                </div>
                <span className="text-sm text-gray-500">
                  유사도 {(similarVoc.similarity * 100).toFixed(0)}%
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 로그 분석 결과 섹션 */}
      {analysis.logAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">로그 분석 결과</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">검색 시간 범위</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(analysis.logAnalysis.timeRange.from).toLocaleString('ko-KR')} ~{' '}
                {new Date(analysis.logAnalysis.timeRange.to).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">총 검색 건수</label>
              <p className="mt-1 text-sm text-gray-900">
                {analysis.logAnalysis.totalCount.toLocaleString()}건
              </p>
              {analysis.logAnalysis.totalCount > 1000 && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
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
                    <p className="text-sm text-yellow-800">
                      검색 결과가 1,000건을 초과했습니다. 일부 로그만 분석되었을 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">주요 발견사항</label>
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysis.logAnalysis.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DB 조회 결과 섹션 */}
      {analysis.dbQueryResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">DB 조회 결과</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">조회 테이블</label>
              <p className="mt-1 text-sm text-gray-900">
                {analysis.dbQueryResult.tables.join(', ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">주요 발견사항</label>
              <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {analysis.dbQueryResult.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
