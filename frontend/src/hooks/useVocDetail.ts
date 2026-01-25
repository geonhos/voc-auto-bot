'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type {
  Voc,
  VocHistory,
  VocAnalysisResult,
  ChangeStatusRequest,
  UpdateVocRequest,
} from '@/types';

const VOC_DETAIL_QUERY_KEY = 'vocDetail';
const VOC_HISTORY_QUERY_KEY = 'vocHistory';
const VOC_ANALYSIS_QUERY_KEY = 'vocAnalysis';

/**
 * @description Hook for fetching VOC detail information
 */
export function useVocDetail(vocId: number | null) {
  return useQuery({
    queryKey: [VOC_DETAIL_QUERY_KEY, vocId],
    queryFn: async () => {
      if (!vocId) throw new Error('VOC ID is required');
      const response = await api.get<Voc>(`/vocs/${vocId}`);
      return response.data;
    },
    enabled: !!vocId,
  });
}

/**
 * @description Hook for fetching VOC change history
 */
export function useVocHistory(vocId: number | null) {
  return useQuery({
    queryKey: [VOC_HISTORY_QUERY_KEY, vocId],
    queryFn: async () => {
      if (!vocId) throw new Error('VOC ID is required');
      const response = await api.get<{ history: VocHistory[] }>(`/vocs/${vocId}/history`);
      return response.data.history;
    },
    enabled: !!vocId,
  });
}

/**
 * @description Hook for fetching VOC AI analysis results
 */
export function useVocAnalysis(vocId: number | null) {
  return useQuery({
    queryKey: [VOC_ANALYSIS_QUERY_KEY, vocId],
    queryFn: async () => {
      if (!vocId) throw new Error('VOC ID is required');
      const response = await api.get<VocAnalysisResult>(`/vocs/${vocId}/analysis`);
      return response.data;
    },
    enabled: !!vocId,
  });
}

/**
 * @description Hook for changing VOC status
 */
export function useChangeVocStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, data }: { vocId: number; data: ChangeStatusRequest }) => {
      const response = await api.post<Voc>(`/vocs/${vocId}/status`, data);
      return response.data;
    },
    onSuccess: (_, { vocId }) => {
      queryClient.invalidateQueries({ queryKey: [VOC_DETAIL_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: [VOC_HISTORY_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: ['vocs'] });
    },
  });
}

/**
 * @description Hook for completing VOC
 */
export function useCompleteVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vocId: number) => {
      const response = await api.post<Voc>(`/vocs/${vocId}/complete`);
      return response.data;
    },
    onSuccess: (_, vocId) => {
      queryClient.invalidateQueries({ queryKey: [VOC_DETAIL_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: [VOC_HISTORY_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: ['vocs'] });
    },
  });
}

/**
 * @description Hook for rejecting VOC
 */
export function useRejectVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, reason }: { vocId: number; reason: string }) => {
      const response = await api.post<Voc>(`/vocs/${vocId}/reject`, { reason });
      return response.data;
    },
    onSuccess: (_, { vocId }) => {
      queryClient.invalidateQueries({ queryKey: [VOC_DETAIL_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: [VOC_HISTORY_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: ['vocs'] });
    },
  });
}

/**
 * @description Hook for updating VOC category
 */
export function useUpdateVocCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, categoryId }: { vocId: number; categoryId: number }) => {
      const response = await api.patch<Voc>(`/vocs/${vocId}/category`, { categoryId });
      return response.data;
    },
    onSuccess: (_, { vocId }) => {
      queryClient.invalidateQueries({ queryKey: [VOC_DETAIL_QUERY_KEY, vocId] });
      queryClient.invalidateQueries({ queryKey: [VOC_HISTORY_QUERY_KEY, vocId] });
    },
  });
}

/**
 * @description Hook for downloading VOC attachment
 */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async ({ vocId, fileId }: { vocId: number; fileId: number }) => {
      const response = await fetch(`/api/v1/vocs/${vocId}/attachments/${fileId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('파일 다운로드에 실패했습니다');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'download'
        : 'download';

      return { blob, filename };
    },
  });
}
