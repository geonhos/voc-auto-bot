'use client';

import { cn } from '@/lib/utils';
import type { SimilarVoc } from '@/types';

import { VocStatusBadge } from './VocStatusBadge';

interface SimilarVocCardProps {
  voc: SimilarVoc;
  onClick?: (vocId: number) => void;
  className?: string;
}

/**
 * @description Card component for displaying a similar VOC
 * Shows similarity percentage, title, status, and creation date
 */
export function SimilarVocCard({ voc, onClick, className }: SimilarVocCardProps) {
  const similarityPercent = Math.round(voc.similarity * 100);

  const handleClick = () => {
    onClick?.(voc.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(voc.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getSimilarityColor = (percent: number) => {
    if (percent >= 80) return 'bg-red-100 text-red-700 border-red-200';
    if (percent >= 60) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (percent >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative bg-white border border-gray-200 rounded-lg p-4',
        'hover:border-blue-300 hover:shadow-md transition-all cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      aria-label={`유사 VOC ${voc.ticketId}`}
    >
      {/* Similarity Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={cn(
            'px-3 py-1 text-xs font-bold rounded-full border',
            getSimilarityColor(similarityPercent)
          )}
        >
          {similarityPercent}%
        </span>
      </div>

      {/* Ticket ID */}
      <div className="mb-2">
        <span className="text-xs font-medium text-blue-600">{voc.ticketId}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 mb-3 pr-16 line-clamp-2">
        {voc.title}
      </h3>

      {/* Footer - Status and Date */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <VocStatusBadge status={voc.status} />
        <span>{formatDate(voc.createdAt)}</span>
      </div>
    </div>
  );
}
