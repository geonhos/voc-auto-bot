'use client';

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { VocStatusLookupRequest, VocStatusLookupResponse } from '@/types';

/**
 * @description Hook for looking up VOC status by ticket ID and email
 * Public endpoint - no authentication required
 */
export function useVocStatusLookup() {
  return useMutation({
    mutationFn: async (data: VocStatusLookupRequest) => {
      const response = await api.post<VocStatusLookupResponse>('/vocs/public/status', data);
      return response.data;
    },
  });
}
