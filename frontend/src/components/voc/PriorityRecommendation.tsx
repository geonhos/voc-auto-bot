'use client';

import { cn } from '@/lib/utils';
import type { VocPriority } from '@/types';
import { priorityLabels, priorityColors } from '@/types/vocForm';

interface PriorityRecommendationProps {
  recommendedPriority: VocPriority | null;
  currentPriority: VocPriority;
}

export function PriorityRecommendation({
  recommendedPriority,
  currentPriority,
}: PriorityRecommendationProps) {
  if (!recommendedPriority) return null;

  const isUserChanged = currentPriority !== recommendedPriority;

  return (
    <div className="flex items-center gap-2 mt-1">
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          priorityColors[recommendedPriority]
        )}
      >
        추천: {priorityLabels[recommendedPriority]}
      </span>
      {isUserChanged && (
        <span className="text-xs text-gray-500">(사용자 변경됨)</span>
      )}
    </div>
  );
}
