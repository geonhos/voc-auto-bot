'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { User, UserRole } from '@/types';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

const createUserSchema = z.object({
  username: z
    .string()
    .min(4, '아이디는 4자 이상이어야 합니다')
    .max(20, '아이디는 20자 이하여야 합니다')
    .regex(/^[a-zA-Z0-9_]+$/, '영문, 숫자, 언더스코어만 사용 가능합니다'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      '대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR'] as const),
});

const updateUserSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').max(50, '이름은 50자 이하여야 합니다'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR'] as const),
  isActive: z.boolean().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'MANAGER', label: '매니저' },
  { value: 'OPERATOR', label: '상담원' },
];

export function UserForm({ user, onClose }: UserFormProps) {
  const isEdit = !!user;
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: isEdit
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }
      : {
          username: '',
          password: '',
          name: '',
          email: '',
          role: 'OPERATOR',
        },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    try {
      if (isEdit && user) {
        await updateMutation.mutateAsync({
          userId: user.id,
          data: data as UpdateUserFormData,
        });
      } else {
        await createMutation.mutateAsync(data as CreateUserFormData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? '사용자 수정' : '사용자 추가'}
          </h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {(error as { response?: { data?: { error?: { message?: string } } } }).response?.data
                ?.error?.message || '저장에 실패했습니다'}
            </div>
          )}

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input
                  type="text"
                  {...register('username' as keyof CreateUserFormData)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    (errors as Record<string, { message?: string }>).username
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  )}
                />
                {(errors as Record<string, { message?: string }>).username && (
                  <p className="mt-1 text-sm text-red-600">{(errors as Record<string, { message?: string }>).username?.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  {...register('password' as keyof CreateUserFormData)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                    (errors as Record<string, { message?: string }>).password
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200'
                  )}
                />
                {(errors as Record<string, { message?: string }>).password && (
                  <p className="mt-1 text-sm text-red-600">{(errors as Record<string, { message?: string }>).password?.message}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              {...register('email')}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
                errors.email
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200'
              )}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              disabled={isPending}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-lg',
                isPending
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
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
