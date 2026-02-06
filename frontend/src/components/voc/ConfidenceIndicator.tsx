'use client';

import { useState } from 'react';
import type {
  ConfidenceLevel,
  AnalysisMethod,
  ConfidenceDetails,
} from '@/types/voc';
import {
  getConfidenceLevelColor,
  getConfidenceLevelLabel,
  getAnalysisMethodLabel,
} from '@/types/voc';

interface ConfidenceIndicatorProps {
  /** Confidence score (0.0 - 1.0) */
  confidence: number;
  /** Confidence level classification */
  confidenceLevel?: ConfidenceLevel;
  /** Analysis method used */
  analysisMethod?: AnalysisMethod;
  /** Detailed confidence information */
  confidenceDetails?: ConfidenceDetails;
  /** Number of vector matches found */
  vectorMatchCount?: number;
  /** Show compact version (no details) */
  compact?: boolean;
}

/**
 * ConfidenceIndicator Component
 *
 * Displays AI analysis confidence with:
 * - Progress bar with color coding (green/yellow/red)
 * - Percentage display
 * - Analysis method badge
 * - Expandable details with factors
 * - Low confidence warning
 */
export function ConfidenceIndicator({
  confidence,
  confidenceLevel,
  analysisMethod,
  confidenceDetails,
  vectorMatchCount,
  compact = false,
}: ConfidenceIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Determine confidence level from score if not provided
  const effectiveLevel: ConfidenceLevel = confidenceLevel ||
    (confidence >= 0.7 ? 'HIGH' : confidence >= 0.4 ? 'MEDIUM' : 'LOW');

  const colorClass = getConfidenceLevelColor(effectiveLevel);
  const levelLabel = getConfidenceLevelLabel(effectiveLevel);

  // Color mapping for Tailwind
  const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    success: { bar: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
    warning: { bar: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' },
    danger: { bar: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10' },
    slate: { bar: 'bg-slate-500', text: 'text-slate-500', bg: 'bg-slate-100' },
  };

  const colors = colorMap[colorClass] || colorMap.slate;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-24">
          <div
            className={`h-full rounded-full transition-all ${colors.bar}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${colors.text}`}>
          {Math.round(confidence * 100)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
        <span className={`text-sm font-semibold min-w-[50px] text-right ${colors.text}`}>
          {Math.round(confidence * 100)}%
        </span>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Confidence level badge */}
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
        >
          {levelLabel}
        </span>

        {/* Analysis method badge */}
        {analysisMethod && (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              analysisMethod === 'rag'
                ? 'bg-primary/10 text-primary'
                : analysisMethod === 'rule_based'
                ? 'bg-info/10 text-info'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {getAnalysisMethodLabel(analysisMethod)}
          </span>
        )}

        {/* Vector match count */}
        {vectorMatchCount !== undefined && vectorMatchCount > 0 && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            유사 로그 {vectorMatchCount}건
          </span>
        )}

        {/* Details toggle */}
        {confidenceDetails && (
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-2 py-0.5 rounded text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
          >
            <span className="material-icons-outlined text-sm">
              {showDetails ? 'expand_less' : 'expand_more'}
            </span>
            상세
          </button>
        )}
      </div>

      {/* Low confidence warning */}
      {effectiveLevel === 'LOW' && (
        <div className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/20">
          <span className="material-icons-outlined text-warning text-sm mt-0.5">
            warning
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            분석 정확도가 낮을 수 있습니다. 참고용으로만 활용하시고 직접 확인을 권장합니다.
          </p>
        </div>
      )}

      {/* Expandable details */}
      {showDetails && confidenceDetails && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
          {/* Factors list */}
          {confidenceDetails.factors && confidenceDetails.factors.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                신뢰도 판단 요소
              </span>
              <ul className="space-y-1">
                {confidenceDetails.factors.map((factor, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span className="material-icons-outlined text-sm text-primary mt-0.5">
                      check_circle
                    </span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown details */}
          {confidenceDetails.breakdown && (
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                점수 상세
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <span className="text-slate-500">벡터 유사도:</span>{' '}
                  <span className="font-medium">
                    {Math.round(confidenceDetails.breakdown.vectorMatchScore * 100)}%
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-500">매칭 수:</span>{' '}
                  <span className="font-medium">
                    {Math.round(confidenceDetails.breakdown.vectorMatchCountScore * 100)}%
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-500">LLM 응답:</span>{' '}
                  <span className="font-medium">
                    {Math.round(confidenceDetails.breakdown.llmResponseScore * 100)}%
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-500">분석 방법:</span>{' '}
                  <span className="font-medium">
                    {Math.round(confidenceDetails.breakdown.methodWeight * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ConfidenceIndicator;
