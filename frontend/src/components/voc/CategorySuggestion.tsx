'use client';

import { cn } from '@/lib/utils';
import type { CategorySuggestion as CategorySuggestionType } from '@/hooks/useCategorySuggestion';

interface CategorySuggestionProps {
  suggestions: CategorySuggestionType[];
  isLoading: boolean;
  onSelect: (categoryId: number, parentCategoryId: number | null) => void;
}

export function CategorySuggestion({ suggestions, isLoading, onSelect }: CategorySuggestionProps) {
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
          AI 추천
        </span>
        {isLoading && (
          <svg
            className="animate-spin h-3.5 w-3.5 text-purple-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.categoryId}
              type="button"
              onClick={() => onSelect(suggestion.categoryId, null)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
                'border border-purple-200 bg-purple-50 text-purple-700',
                'hover:bg-purple-100 hover:border-purple-300 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-purple-200'
              )}
            >
              <span>{suggestion.categoryName}</span>
              <span className="text-xs text-purple-500">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
