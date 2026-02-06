'use client';

import React from 'react';
import {
  ConfidenceLevel,
  AnalysisMethod,
  ConfidenceDetails,
  getConfidenceLevelColor,
  getConfidenceLevelFromScore,
  getAnalysisMethodLabel,
} from '@/types/voc';

interface ConfidenceIndicatorProps {
  confidence: number;
  confidenceLevel?: ConfidenceLevel;
  analysisMethod?: AnalysisMethod;
  vectorMatchCount?: number;
  confidenceDetails?: ConfidenceDetails;
  showMethodBadge?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * AI 분석 신뢰도 시각화 컴포넌트
 *
 * 프로그레스 바와 퍼센트로 신뢰도를 표시하고,
 * 분석 방법 배지와 상세 정보 툴팁을 제공합니다.
 */
export function ConfidenceIndicator({
  confidence,
  confidenceLevel,
  analysisMethod,
  vectorMatchCount,
  confidenceDetails,
  showMethodBadge = true,
  showTooltip = true,
  size = 'md',
}: ConfidenceIndicatorProps) {
  // Determine confidence level from score if not provided
  const level = confidenceLevel || getConfidenceLevelFromScore(confidence);
  const color = getConfidenceLevelColor(level);
  const percentage = Math.round(confidence * 100);

  // Size configurations
  const sizeConfig = {
    sm: {
      barHeight: 'h-1.5',
      textSize: 'text-xs',
      badgeSize: 'text-xs px-1.5 py-0.5',
    },
    md: {
      barHeight: 'h-2',
      textSize: 'text-sm',
      badgeSize: 'text-xs px-2 py-0.5',
    },
    lg: {
      barHeight: 'h-3',
      textSize: 'text-base',
      badgeSize: 'text-sm px-2.5 py-1',
    },
  };

  const config = sizeConfig[size];

  // Color configurations
  const colorConfig: Record<string, { bg: string; bar: string; text: string; badge: string }> = {
    green: {
      bg: 'bg-green-100',
      bar: 'bg-green-500',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800 border-green-200',
    },
    yellow: {
      bg: 'bg-yellow-100',
      bar: 'bg-yellow-500',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    red: {
      bg: 'bg-red-100',
      bar: 'bg-red-500',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800 border-red-200',
    },
    gray: {
      bg: 'bg-gray-100',
      bar: 'bg-gray-500',
      text: 'text-gray-700',
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const colors = colorConfig[color] || colorConfig.gray;

  // Level labels in Korean
  const levelLabels: Record<ConfidenceLevel, string> = {
    HIGH: '높음',
    MEDIUM: '보통',
    LOW: '낮음',
  };

  // Method badge colors
  const methodBadgeColors: Record<AnalysisMethod, string> = {
    rag: 'bg-blue-100 text-blue-800 border-blue-200',
    rule_based: 'bg-purple-100 text-purple-800 border-purple-200',
    direct_llm: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${config.textSize} ${colors.text}`}>
            신뢰도: {levelLabels[level]}
          </span>
          {showMethodBadge && analysisMethod && (
            <span
              className={`inline-flex items-center rounded-full border ${config.badgeSize} font-medium ${methodBadgeColors[analysisMethod] || 'bg-gray-100'}`}
            >
              {getAnalysisMethodLabel(analysisMethod)}
            </span>
          )}
        </div>
        <span className={`${config.textSize} font-semibold ${colors.text}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={`w-full ${colors.bg} rounded-full ${config.barHeight}`}>
        <div
          className={`${colors.bar} ${config.barHeight} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Vector match count */}
      {vectorMatchCount !== undefined && (
        <div className={`mt-1 ${config.textSize} text-gray-500`}>
          유사 로그 {vectorMatchCount}개 발견
        </div>
      )}

      {/* Low confidence warning */}
      {level === 'LOW' && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
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
            <div className="text-xs text-red-700">
              <p className="font-medium">분석 정확도가 낮을 수 있습니다</p>
              <p className="mt-0.5 text-red-600">
                {analysisMethod === 'direct_llm'
                  ? '참조 데이터 없이 분석되었습니다. 결과를 주의해서 확인해주세요.'
                  : analysisMethod === 'rule_based'
                    ? '규칙 기반 분석으로 정확도가 제한적입니다.'
                    : '유사한 로그 데이터가 부족하여 정확도가 낮습니다.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip with details */}
      {showTooltip && confidenceDetails && confidenceDetails.factors.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <details className="cursor-pointer">
            <summary className="hover:text-gray-700">상세 정보 보기</summary>
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              {confidenceDetails.factors.map((factor, index) => (
                <li key={index}>{factor}</li>
              ))}
            </ul>
            {confidenceDetails.breakdown && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <div>벡터 매칭: {Math.round((confidenceDetails.breakdown.vectorMatchScore || 0) * 100)}%</div>
                <div>유사도: {Math.round((confidenceDetails.breakdown.similarityScore || 0) * 100)}%</div>
                <div>응답 완성도: {Math.round((confidenceDetails.breakdown.responseCompleteness || 0) * 100)}%</div>
                <div>카테고리: {Math.round((confidenceDetails.breakdown.categoryMatchScore || 0) * 100)}%</div>
              </div>
            )}
          </details>
        </div>
      )}
    </div>
  );
}

/**
 * 간단한 신뢰도 배지 컴포넌트
 */
export function ConfidenceBadge({
  confidence,
  confidenceLevel,
}: {
  confidence: number;
  confidenceLevel?: ConfidenceLevel;
}) {
  const level = confidenceLevel || getConfidenceLevelFromScore(confidence);
  const color = getConfidenceLevelColor(level);
  const percentage = Math.round(confidence * 100);

  const colorConfig: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorConfig[color] || colorConfig.gray}`}
    >
      {percentage}%
    </span>
  );
}

export default ConfidenceIndicator;
