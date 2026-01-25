'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useVocStatusLookup } from '@/hooks/useVocStatus';
import { VocStatusResult } from './VocStatusResult';
import type { VocStatusDetail } from '@/types';

const vocStatusLookupSchema = z.object({
  ticketId: z
    .string()
    .min(1, '티켓 ID를 입력해주세요')
    .regex(/^VOC-\d{8}-\d{5}$/, '올바른 티켓 ID 형식이 아닙니다 (예: VOC-20260123-00001)'),
  customerEmail: z
    .string()
    .min(1, '이메일 주소를 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
});

type VocStatusLookupFormData = z.infer<typeof vocStatusLookupSchema>;

/**
 * @description Component for VOC status lookup form
 */
export function VocStatusLookup() {
  const [vocStatus, setVocStatus] = useState<VocStatusDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VocStatusLookupFormData>({
    resolver: zodResolver(vocStatusLookupSchema),
    defaultValues: {
      ticketId: '',
      customerEmail: '',
    },
  });

  const mutation = useVocStatusLookup();

  const onSubmit = async (data: VocStatusLookupFormData) => {
    setNotFound(false);
    setVocStatus(null);

    try {
      const result = await mutation.mutateAsync(data);
      setVocStatus(result);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setNotFound(true);
      }
    }
  };

  const handleReset = () => {
    reset();
    setVocStatus(null);
    setNotFound(false);
  };

  return (
    <div className="space-y-6">
      {/* 검색 폼 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ticket ID */}
            <div>
              <label
                htmlFor="ticketId"
                className="block text-sm font-semibold mb-2 after:content-['*'] after:ml-1 after:text-red-500"
              >
                Ticket ID
              </label>
              <input
                id="ticketId"
                type="text"
                {...register('ticketId')}
                placeholder="VOC-YYYYMMDD-XXXXX"
                maxLength={22}
                autoComplete="off"
                className={cn(
                  'w-full px-4 py-2 bg-white dark:bg-slate-700 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all',
                  errors.ticketId
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 dark:border-gray-600'
                )}
                aria-required="true"
                aria-describedby="ticketIdHelp"
                aria-invalid={!!errors.ticketId}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" id="ticketIdHelp">
                예: VOC-20260123-00001
              </p>
              {errors.ticketId && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.ticketId.message}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label
                htmlFor="customerEmail"
                className="block text-sm font-semibold mb-2 after:content-['*'] after:ml-1 after:text-red-500"
              >
                최종 사용자 이메일
              </label>
              <input
                id="customerEmail"
                type="email"
                {...register('customerEmail')}
                placeholder="user@example.com"
                autoComplete="off"
                className={cn(
                  'w-full px-4 py-2 bg-white dark:bg-slate-700 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all',
                  errors.customerEmail
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 dark:border-gray-600'
                )}
                aria-required="true"
                aria-describedby="emailHelp"
                aria-invalid={!!errors.customerEmail}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" id="emailHelp">
                VOC 접수 시 입력한 이메일 주소
              </p>
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.customerEmail.message}
                </p>
              )}
            </div>

            {/* 전역 에러 메시지 */}
            {mutation.isError && !notFound && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-700">
                  조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                </p>
              </div>
            )}

            {/* 버튼 */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={mutation.isPending}
                className={cn(
                  'flex-1 px-6 py-3 border font-semibold rounded transition-colors',
                  mutation.isPending
                    ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
                aria-label="입력 초기화"
              >
                초기화
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className={cn(
                  'flex-1 px-6 py-3 font-semibold rounded transition-colors shadow-sm',
                  mutation.isPending
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
                aria-label="VOC 상태 조회"
              >
                {mutation.isPending ? '조회 중...' : '조회'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 조회 결과 영역 */}
      {vocStatus && <VocStatusResult vocStatus={vocStatus} />}

      {/* Empty State (조회 결과가 없을 때) */}
      {notFound && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <span
              className="material-icons-outlined text-slate-300 dark:text-slate-600 mb-4"
              style={{ fontSize: '4rem' }}
            >
              search
            </span>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
              조회 결과가 없습니다
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ticket ID와 이메일을 확인해주세요
            </p>
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
        <span className="material-icons-outlined text-blue-600">info</span>
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <p className="mb-2">
            <strong>보안 안내:</strong> Ticket ID와 이메일 정보가 일치해야만 조회가 가능합니다.
          </p>
          <p>조회 요청은 분당 10건으로 제한됩니다. 과도한 요청 시 일시적으로 차단될 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
