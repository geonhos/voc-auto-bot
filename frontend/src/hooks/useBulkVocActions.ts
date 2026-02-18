'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { useToast } from '@/hooks/useToast';
import type {
  BulkStatusChangeRequest,
  BulkAssignRequest,
  BulkPriorityChangeRequest,
  BulkOperationResponse,
} from '@/types';

const VOCS_QUERY_KEY = 'vocs';

export function useBulkChangeStatus() {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  return useMutation({
    mutationFn: async (data: BulkStatusChangeRequest) => {
      const response = await api.patch<BulkOperationResponse>('/vocs/batch/status', data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
      if (result.failedIds.length === 0) {
        success(`${result.successCount}건의 상태가 변경되었습니다.`);
      } else {
        warning(
          `${result.successCount}건 성공, ${result.failedIds.length}건 실패`,
          '일부 항목 처리 실패'
        );
      }
    },
    onError: () => {
      error('상태 일괄 변경에 실패했습니다.');
    },
  });
}

export function useBulkAssign() {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  return useMutation({
    mutationFn: async (data: BulkAssignRequest) => {
      const response = await api.patch<BulkOperationResponse>('/vocs/batch/assign', data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
      if (result.failedIds.length === 0) {
        success(`${result.successCount}건에 담당자가 배정되었습니다.`);
      } else {
        warning(
          `${result.successCount}건 성공, ${result.failedIds.length}건 실패`,
          '일부 항목 처리 실패'
        );
      }
    },
    onError: () => {
      error('담당자 일괄 배정에 실패했습니다.');
    },
  });
}

export function useBulkChangePriority() {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  return useMutation({
    mutationFn: async (data: BulkPriorityChangeRequest) => {
      const response = await api.patch<BulkOperationResponse>('/vocs/batch/priority', data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
      if (result.failedIds.length === 0) {
        success(`${result.successCount}건의 우선순위가 변경되었습니다.`);
      } else {
        warning(
          `${result.successCount}건 성공, ${result.failedIds.length}건 실패`,
          '일부 항목 처리 실패'
        );
      }
    },
    onError: () => {
      error('우선순위 일괄 변경에 실패했습니다.');
    },
  });
}
