'use client';

import { useMemo } from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types';
import { cn } from '@/lib/utils';

interface CategorySelectProps {
  value: number | null;
  error?: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

/**
 * @description CategorySelect component with parent-child category linking
 * Displays two-level category selection (parent -> child)
 */
export function CategorySelect({ value, error, register, setValue, watch }: CategorySelectProps) {
  const { data: categories = [], isLoading } = useCategories();

  // 대분류 카테고리 (type: MAIN 또는 level: 0/1, parentId가 없는 것)
  const parentCategories = useMemo(
    () => categories.filter((cat: Category) => {
      // type 기반 필터링 (API 응답이 type을 반환하는 경우)
      if (cat.type) {
        return cat.type === 'MAIN' && cat.isActive;
      }
      // level 기반 필터링 (기존 방식)
      return (cat.level === 0 || cat.level === 1 || cat.parentId === null) && cat.isActive && !cat.parentId;
    }),
    [categories]
  );

  // 선택된 대분류 ID
  const selectedParentId = watch('parentCategoryId');

  // 중분류 카테고리 (type: SUB 또는 level: 1/2, 선택된 parentId를 가진 것)
  const childCategories = useMemo(
    () =>
      selectedParentId
        ? categories.filter((cat: Category) => {
            // type 기반 필터링
            if (cat.type) {
              return cat.parentId === selectedParentId && cat.type === 'SUB' && cat.isActive;
            }
            // level 기반 필터링
            return cat.parentId === selectedParentId && (cat.level === 1 || cat.level === 2) && cat.isActive;
          })
        : [],
    [categories, selectedParentId]
  );

  // 대분류 변경 시 중분류 초기화
  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parentId = e.target.value ? Number(e.target.value) : null;
    setValue('parentCategoryId', parentId);
    setValue('categoryId', null); // 중분류 초기화
  };

  // 중분류 변경
  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value ? Number(e.target.value) : null;
    setValue('categoryId', categoryId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 대분류 선택 */}
      <div>
        <label htmlFor="parentCategoryId" className="block text-sm font-medium text-gray-700 mb-1">
          대분류 <span className="text-red-500">*</span>
        </label>
        <select
          id="parentCategoryId"
          onChange={handleParentChange}
          value={selectedParentId || ''}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            'border-gray-300 focus:ring-blue-200'
          )}
        >
          <option value="">대분류를 선택하세요</option>
          {parentCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* 중분류 선택 */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
          중분류 <span className="text-red-500">*</span>
        </label>
        <select
          id="categoryId"
          {...register('categoryId', { valueAsNumber: true })}
          onChange={handleChildChange}
          value={value || ''}
          disabled={!selectedParentId || childCategories.length === 0}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200',
            (!selectedParentId || childCategories.length === 0) && 'bg-gray-100 cursor-not-allowed'
          )}
          aria-invalid={!!error}
        >
          <option value="">
            {!selectedParentId
              ? '먼저 대분류를 선택하세요'
              : childCategories.length === 0
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
    </div>
  );
}
