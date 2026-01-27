'use client';

import * as Popover from '@radix-ui/react-popover';
import { format, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

export interface DatePickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  children?: React.ReactNode;
}

export function DatePicker({
  isOpen,
  onOpenChange,
  onApply,
  initialStartDate,
  initialEndDate,
  children,
}: DatePickerProps) {
  const [startDate, setStartDate] = useState<string>(
    initialStartDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    initialEndDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [error, setError] = useState<string>('');

  // MAJ-002: Reset state when popover reopens
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate || format(new Date(), 'yyyy-MM-dd'));
      setEndDate(initialEndDate || format(new Date(), 'yyyy-MM-dd'));
      setError('');
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  const handleApply = () => {
    setError('');

    if (!startDate || !endDate) {
      setError('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isAfter(start, end)) {
      setError('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    // 최대 90일 제한
    const maxDays = 90;
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays) {
      setError(`최대 ${maxDays}일까지 조회 가능합니다.`);
      return;
    }

    onApply(startDate, endDate);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setError('');
    onOpenChange(false);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={onOpenChange}>
      {children && (
        <Popover.Trigger asChild>
          {children}
        </Popover.Trigger>
      )}
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-lg"
          sideOffset={5}
          align="start"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                날짜 범위 선택
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="start-date"
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    시작일
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setError('');
                    }}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="시작일"
                  />
                </div>
                <div>
                  <label
                    htmlFor="end-date"
                    className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    종료일
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setError('');
                    }}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="종료일"
                  />
                </div>
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
