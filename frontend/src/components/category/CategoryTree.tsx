'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { CategoryTree as CategoryTreeType } from '@/types';

interface CategoryTreeProps {
  categories: CategoryTreeType[];
  onSelect: (category: CategoryTreeType) => void;
  selectedId?: number | undefined;
}

interface CategoryNodeProps {
  category: CategoryTreeType;
  onSelect: (category: CategoryTreeType) => void;
  selectedId?: number | undefined;
  level: number;
}

function CategoryNode({ category, onSelect, selectedId, level }: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
          selectedId === category.id
            ? 'bg-blue-100 text-blue-800'
            : 'hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(category)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            <svg
              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>

        <span className="flex-1 text-sm font-medium">{category.name}</span>

        <span className="text-xs text-gray-500">{category.code}</span>

        {!category.isActive && (
          <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">비활성</span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              onSelect={onSelect}
              selectedId={selectedId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({ categories, onSelect, selectedId }: CategoryTreeProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        등록된 카테고리가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          onSelect={onSelect}
          selectedId={selectedId}
          level={0}
        />
      ))}
    </div>
  );
}
