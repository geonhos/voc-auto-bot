'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type {
  Voc,
  VocListParams,
  CreateVocRequest,
  UpdateVocRequest,
  AssignVocRequest,
  ChangeStatusRequest,
  AddMemoRequest,
  PageResponse,
} from '@/types';

const VOCS_QUERY_KEY = 'vocs';

export function useVocs(params?: VocListParams) {
  return useQuery({
    queryKey: [VOCS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await api.get<PageResponse<Voc>>('/vocs', params as Record<string, unknown>);
      return response.data;
    },
  });
}

export function useVoc(vocId: number) {
  return useQuery({
    queryKey: [VOCS_QUERY_KEY, vocId],
    queryFn: async () => {
      const response = await api.get<Voc>(`/vocs/${vocId}`);
      return response.data;
    },
    enabled: !!vocId,
  });
}

export function useCreateVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVocRequest) => {
      const response = await api.post<Voc>('/vocs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
    },
  });
}

export function useUpdateVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, data }: { vocId: number; data: UpdateVocRequest }) => {
      const response = await api.put<Voc>(`/vocs/${vocId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
    },
  });
}

export function useAssignVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, data }: { vocId: number; data: AssignVocRequest }) => {
      const response = await api.patch<Voc>(`/vocs/${vocId}/assign`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
    },
  });
}

export function useChangeVocStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, data }: { vocId: number; data: ChangeStatusRequest }) => {
      const response = await api.patch<Voc>(`/vocs/${vocId}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
    },
  });
}

export function useAddVocMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vocId, data }: { vocId: number; data: AddMemoRequest }) => {
      const response = await api.post<Voc>(`/vocs/${vocId}/memos`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
    },
  });
}

export function useReanalyzeVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vocId: number) => {
      const response = await api.post<void>(`/vocs/${vocId}/reanalyze`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VOCS_QUERY_KEY] });
    },
  });
}
