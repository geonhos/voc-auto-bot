'use client';

import { useState } from 'react';

import { useUsers } from '@/hooks/useUsers';
import {
  useBulkChangeStatus,
  useBulkAssign,
  useBulkChangePriority,
} from '@/hooks/useBulkVocActions';
import type { VocStatus, VocPriority } from '@/types';

interface BulkActionBarProps {
  selectedIds: Set<number>;
  onClearSelection: () => void;
}

const STATUS_OPTIONS: { value: VocStatus; label: string }[] = [
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'RESOLVED', label: '해결완료' },
  { value: 'REJECTED', label: '반려' },
];

const PRIORITY_OPTIONS: { value: VocPriority; label: string }[] = [
  { value: 'URGENT', label: '긴급' },
  { value: 'HIGH', label: '높음' },
  { value: 'NORMAL', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

export function BulkActionBar({ selectedIds, onClearSelection }: BulkActionBarProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: 'status' | 'assign' | 'priority';
    label: string;
    execute: () => void;
  } | null>(null);

  const { data: usersResponse } = useUsers({ size: 100, isActive: true });
  const users = usersResponse?.data?.content ?? [];

  const bulkChangeStatus = useBulkChangeStatus();
  const bulkAssign = useBulkAssign();
  const bulkChangePriority = useBulkChangePriority();

  const isLoading =
    bulkChangeStatus.isPending || bulkAssign.isPending || bulkChangePriority.isPending;

  const vocIds = Array.from(selectedIds);

  const handleStatusChange = (status: VocStatus) => {
    const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
    setConfirmAction({
      type: 'status',
      label: `${selectedIds.size}건의 상태를 "${label}"(으)로 변경`,
      execute: () => {
        bulkChangeStatus.mutate(
          { vocIds, status },
          {
            onSettled: () => {
              setConfirmAction(null);
              onClearSelection();
            },
          }
        );
      },
    });
  };

  const handleAssign = (assigneeId: number) => {
    const user = users.find((u) => u.id === assigneeId);
    const name = user?.name ?? `ID:${assigneeId}`;
    setConfirmAction({
      type: 'assign',
      label: `${selectedIds.size}건에 "${name}" 담당자 배정`,
      execute: () => {
        bulkAssign.mutate(
          { vocIds, assigneeId },
          {
            onSettled: () => {
              setConfirmAction(null);
              onClearSelection();
            },
          }
        );
      },
    });
  };

  const handlePriorityChange = (priority: VocPriority) => {
    const label = PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;
    setConfirmAction({
      type: 'priority',
      label: `${selectedIds.size}건의 우선순위를 "${label}"(으)로 변경`,
      execute: () => {
        bulkChangePriority.mutate(
          { vocIds, priority },
          {
            onSettled: () => {
              setConfirmAction(null);
              onClearSelection();
            },
          }
        );
      },
    });
  };

  if (selectedIds.size === 0) return null;

  return (
    <>
      <div className="flex items-center gap-4 px-6 py-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg">
        <span className="text-sm font-semibold text-primary whitespace-nowrap">
          {selectedIds.size}건 선택됨
        </span>

        <div className="flex items-center gap-2">
          {/* Status change dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) handleStatusChange(e.target.value as VocStatus);
              e.target.value = '';
            }}
            disabled={isLoading}
            defaultValue=""
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="" disabled>
              상태 변경
            </option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Assignee dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) handleAssign(Number(e.target.value));
              e.target.value = '';
            }}
            disabled={isLoading}
            defaultValue=""
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="" disabled>
              담당자 배정
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {/* Priority dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) handlePriorityChange(e.target.value as VocPriority);
              e.target.value = '';
            }}
            disabled={isLoading}
            defaultValue=""
            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="" disabled>
              우선순위 변경
            </option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onClearSelection}
          className="ml-auto text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          선택 해제
        </button>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              일괄 작업 확인
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {confirmAction.label}하시겠습니까?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={confirmAction.execute}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isLoading ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
