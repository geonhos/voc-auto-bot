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

// Separate components for better type safety
function CreateCategoryFormContent({
  parentCategory,
  onClose,
}: {
  parentCategory?: CategoryTree | null;
  onClose: () => void;
}) {
  const createMutation = useCreateCategory();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'MAIN' as const,
      description: '',
      parentId: parentCategory?.id || null,
      sortOrder: 0,
    },
  });

  const onSubmit = async (data: CreateCategoryFormData) => {
    try {
      await createMutation.mutateAsync(data);
      onClose();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
      {createMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(createMutation.error as { response?: { data?: { error?: { message?: string } } } })
            .response?.data?.error?.message || '저장에 실패했습니다'}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리명</label>
        <input
          type="text"
          {...register('name')}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
          )}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
        <input
          type="text"
          {...register('code')}
          placeholder="예: PRODUCT_INQUIRY"
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 uppercase',
            errors.code ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
          )}
        />
        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
        <select
          {...register('type')}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            errors.type ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
          )}
        >
          <option value="MAIN">대분류</option>
          <option value="SUB">중분류</option>
        </select>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

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
          disabled={createMutation.isPending}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-lg',
            createMutation.isPending
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {createMutation.isPending ? '저장 중...' : '추가'}
        </button>
      </div>
    </form>
  );
}

function EditCategoryFormContent({
  category,
  onClose,
}: {
  category: CategoryTree;
  onClose: () => void;
}) {
  const updateMutation = useUpdateCategory();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateCategoryFormData>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    },
  });

  useEffect(() => {
    reset({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  }, [category, reset]);

  const onSubmit = async (data: UpdateCategoryFormData) => {
    try {
      await updateMutation.mutateAsync({
        categoryId: category.id,
        data,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
      {updateMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(updateMutation.error as { response?: { data?: { error?: { message?: string } } } })
            .response?.data?.error?.message || '저장에 실패했습니다'}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리명</label>
        <input
          type="text"
          {...register('name')}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
          )}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          {...register('isActive')}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          활성화
        </label>
      </div>

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
          disabled={updateMutation.isPending}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-lg',
            updateMutation.isPending
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {updateMutation.isPending ? '저장 중...' : '수정'}
        </button>
      </div>
    </form>
  );
}

export function CategoryForm({ category, parentCategory, onClose }: CategoryFormProps) {
  const isEdit = !!category;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? '카테고리 수정' : '카테고리 추가'}
          </h3>
          {parentCategory && !isEdit && (
            <p className="text-sm text-gray-500 mt-1">상위 카테고리: {parentCategory.name}</p>
          )}
        </div>

        {isEdit && category ? (
          <EditCategoryFormContent category={category} onClose={onClose} />
        ) : (
          <CreateCategoryFormContent parentCategory={parentCategory} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
