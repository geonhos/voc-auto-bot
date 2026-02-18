'use client';

import {
  Bug,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  ThumbsUp,
} from 'lucide-react';
import { useMemo } from 'react';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { CATEGORY_CARD_META } from '@/types/vocForm';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bug,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  ThumbsUp,
};

interface CategoryCardSelectProps {
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  error?: string;
  disabled?: boolean;
}

export function CategoryCardSelect({
  setValue,
  watch,
  error,
  disabled = false,
}: CategoryCardSelectProps) {
  const { data: categories = [], isLoading } = useCategories();

  const parentCategories = useMemo(
    () =>
      categories.filter((cat: Category) => {
        if (cat.type) return cat.type === 'MAIN' && cat.isActive;
        return (cat.level === 0 || cat.level === 1 || cat.parentId === null) && cat.isActive && !cat.parentId;
      }),
    [categories]
  );

  const selectedParentId = watch('parentCategoryId');

  const childCategories = useMemo(
    () =>
      selectedParentId
        ? categories.filter((cat: Category) => {
            if (cat.type) return cat.parentId === selectedParentId && cat.type === 'SUB' && cat.isActive;
            return cat.parentId === selectedParentId && (cat.level === 1 || cat.level === 2) && cat.isActive;
          })
        : [],
    [categories, selectedParentId]
  );

  const selectedParentCode = useMemo(() => {
    if (!selectedParentId) return null;
    const cat = parentCategories.find((c) => c.id === selectedParentId);
    return cat?.code ?? null;
  }, [selectedParentId, parentCategories]);

  const handleCardClick = (categoryCode: string) => {
    if (disabled) return;
    const parent = parentCategories.find((c) => c.code === categoryCode);
    if (!parent) return;

    if (parent.id === selectedParentId) {
      // Deselect
      setValue('parentCategoryId', null);
      setValue('categoryId', null);
    } else {
      setValue('parentCategoryId', parent.id);
      setValue('categoryId', null);
    }
  };

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value ? Number(e.target.value) : null;
    setValue('categoryId', categoryId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        카테고리 <span className="text-red-500">*</span>
      </label>

      {/* 대분류 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {CATEGORY_CARD_META.map((meta) => {
          const Icon = ICON_MAP[meta.icon];
          const isSelected = selectedParentCode === meta.code;
          const parentExists = parentCategories.some((c) => c.code === meta.code);

          if (!parentExists) return null;

          return (
            <button
              key={meta.code}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => handleCardClick(meta.code)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all text-center',
                disabled
                  ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                  : isSelected
                    ? meta.colorClass
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm text-gray-600'
              )}
            >
              {Icon && <Icon className="w-6 h-6" />}
              <span className="text-sm font-medium">{meta.label}</span>
              <span className="text-xs opacity-75 leading-tight hidden sm:block">
                {meta.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* 중분류 드롭다운 (progressive disclosure) */}
      {selectedParentId && (
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
            중분류 <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            onChange={handleChildChange}
            value={watch('categoryId') || ''}
            disabled={disabled || childCategories.length === 0}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
              error
                ? 'border-red-500 focus:ring-red-200'
                : disabled || childCategories.length === 0
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 focus:ring-blue-200'
            )}
            aria-invalid={!!error}
          >
            <option value="">
              {childCategories.length === 0
                ? '중분류가 없습니다'
                : '중분류를 선택하세요'}
            </option>
            {childCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {disabled && (
        <p className="text-sm text-gray-500">
          제목과 내용을 입력하면 자동으로 작성됩니다
        </p>
      )}
    </div>
  );
}
