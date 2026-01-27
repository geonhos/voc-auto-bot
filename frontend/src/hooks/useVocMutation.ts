'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { Voc, CreateVocRequest } from '@/types';

/**
 * @description Manages VOC creation mutation
 */
export function useCreateVoc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVocRequest) => {
      const response = await api.post<Voc>('/vocs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocs'] });
    },
  });
}

/**
 * @description Manages VOC file upload mutation
 */
export function useUploadVocFiles() {
  return useMutation({
    mutationFn: async ({ vocId, files }: { vocId: number; files: File[] }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.upload<{ attachments: Array<{ id: number; originalFileName: string }> }>(
        `/vocs/${vocId}/attachments`,
        formData
      );
      return response.data;
    },
  });
}

/**
 * @description Combined hook for creating VOC with file uploads
 */
interface UseVocCreationProps {
  onSuccess?: (voc: Voc) => void;
  onError?: (error: Error) => void;
}

export function useVocCreation({ onSuccess, onError }: UseVocCreationProps = {}) {
  const createVoc = useCreateVoc();
  const uploadFiles = useUploadVocFiles();

  const createWithFiles = async (data: CreateVocRequest & { files?: File[] }) => {
    try {
      // 1. VOC 생성
      const voc = await createVoc.mutateAsync(data);

      // 2. 파일이 있는 경우 업로드
      if (data.files && data.files.length > 0) {
        await uploadFiles.mutateAsync({ vocId: voc.id, files: data.files });
      }

      onSuccess?.(voc);
      return voc;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  };

  return {
    createWithFiles,
    isCreating: createVoc.isPending,
    isUploading: uploadFiles.isPending,
    isPending: createVoc.isPending || uploadFiles.isPending,
    error: createVoc.error || uploadFiles.error,
  };
}
