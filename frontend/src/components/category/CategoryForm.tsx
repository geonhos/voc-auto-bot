'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CategoryTree } from '@/types';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

const createCategorySchema = z.object({
  name: z.string().min(2, '카테고리명은 2자 이상이어야 합니다').max(50, '50자 이하여야 합니다'),
  code: z
    .string()
    .min(2, '코드는 2자 이상이어야 합니다')
    .max(30, '30자 이하여야 합니다')
    .regex(/^[A-Z0-9_]+$/, '대문자, 숫자, 언더스코어만 사용 가능합니다'),
  type: z.enum(['MAIN', 'SUB'], {
    required_error: '타입을 선택해주세요',
  }),
  description: z.string().max(200, '200자 이하여야 합니다').optional(),
  parentId: z.number().nullable().optional(),
  sortOrder: z.number().min(0).optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(2, '카테고리명은 2자 이상이어야 합니다').max(50, '50자 이하여야 합니다'),
  description: z.string().max(200, '200자 이하여야 합니다').optional(),
  sortOrder: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

interface CategoryFormProps {
  category?: CategoryTree | null;
  parentCategory?: CategoryTree | null;
  onClose: () => void;
}

export function CategoryForm({ category, parentCategory, onClose }: CategoryFormProps) {
  const isEdit = !!category;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryFormData | UpdateCategoryFormData>({
    resolver: zodResolver(isEdit ? updateCategorySchema : createCategorySchema),
    defaultValues: isEdit
      ? {
          name: category.name,
          description: category.description || '',
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        }
      : {
          name: '',
          code: '',
          type: 'MAIN' as const,
          description: '',
          parentId: parentCategory?.id || null,
          sortOrder: 0,
        },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: CreateCategoryFormData | UpdateCategoryFormData) => {
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({
          categoryId: category.id,
          data: data as UpdateCategoryFormData,
        });
      } else {
        await createMutation.mutateAsync(data as CreateCategoryFormData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? '카테고리 수정' : '카테고리 추가'}
          </h3>
          {parentCategory && !isEdit && (
            <p className="text-sm text-gray-500 mt-1">
              상위 카테고리: {parentCategory.name}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {(error as { response?: { data?: { error?: { message?: string } } } }).response?.data
                ?.error?.message || '저장에 실패했습니다'}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리명</label>
            <input
              type="text"
              {...register('name')}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                errors.name
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              )}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
                <input
                  type="text"
                  {...register('code' as keyof CreateCategoryFormData)}
                  placeholder="예: PRODUCT_INQUIRY"
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase',
                    (errors as { code?: { message?: string } }).code
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  )}
                />
                {(errors as { code?: { message?: string } }).code && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors as { code?: { message?: string } }).code?.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                <select
                  {...register('type' as keyof CreateCategoryFormData)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    (errors as { type?: { message?: string } }).type
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  )}
                >
                  <option value="MAIN">대분류</option>
                  <option value="SUB">중분류</option>
                </select>
                {(errors as { type?: { message?: string } }).type && (
                  <p className="mt-1 text-sm text-red-600">
                    {(errors as { type?: { message?: string } }).type?.message}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
            <input
              type="number"
              {...register('sortOrder', { valueAsNumber: true })}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive' as keyof UpdateCategoryFormData)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                활성화
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-lg',
                isPending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
