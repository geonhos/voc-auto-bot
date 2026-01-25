'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { AddMemoRequest, Voc } from '@/types';

/**
 * @description Hook for adding memo to VOC
 */
export function useAddVocMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, data }: { vocId: number; data: AddMemoRequest }) => {
      const response = await api.post<Voc>(`/vocs/${vocId}/memos`, data);
      return response.data;
    },
    onSuccess: (_, { vocId }) => {
      queryClient.invalidateQueries({ queryKey: ['vocDetail', vocId] });
    },
  });
}

/**
 * @description Hook for deleting memo from VOC
 */
export function useDeleteVocMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, memoId }: { vocId: number; memoId: number }) => {
      const response = await api.delete<void>(`/vocs/${vocId}/memos/${memoId}`);
      return response.data;
    },
    onSuccess: (_, { vocId }) => {
      queryClient.invalidateQueries({ queryKey: ['vocDetail', vocId] });
    },
  });
}

/**
 * @description Hook for saving memo draft
 */
export function useSaveMemoDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, content }: { vocId: number; content: string }) => {
      const response = await api.post<void>(`/vocs/${vocId}/memos/draft`, { content });
      return response.data;
    },
    onSuccess: (_, { vocId }) => {
      queryClient.invalidateQueries({ queryKey: ['vocDetail', vocId] });
    },
  });
}
