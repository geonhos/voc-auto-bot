'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { VocAnalysisResult } from '@/types';

/**
 * @description Hook for fetching VOC AI analysis results
 */
export function useVocAnalysis(vocId: number | null) {
  return useQuery({
    queryKey: ['vocAnalysis', vocId],
    queryFn: async () => {
      if (!vocId) throw new Error('VOC ID is required');
      const response = await api.get<VocAnalysisResult>(`/vocs/${vocId}/analysis`);
      return response.data;
    },
    enabled: !!vocId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
