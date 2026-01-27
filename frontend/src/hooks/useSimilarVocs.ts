'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { SimilarVoc, PageResponse } from '@/types';

const SIMILAR_VOCS_QUERY_KEY = 'similar-vocs';

export interface UseSimilarVocsParams {
  limit?: number;
  minSimilarity?: number;
}

export interface UseSimilarVocsOptions extends UseSimilarVocsParams {
  enabled?: boolean;
}

/**
 * @description Hook for fetching similar VOCs
 * Retrieves VOCs similar to the specified VOC based on AI analysis
 */
export function useSimilarVocs(
  vocId: number,
  { limit, minSimilarity = 0, enabled = true }: UseSimilarVocsOptions = {}
) {
  return useQuery({
    queryKey: [SIMILAR_VOCS_QUERY_KEY, vocId, limit, minSimilarity],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (limit) params.limit = limit;
      if (minSimilarity) params.minSimilarity = minSimilarity;

      const response = await api.get<SimilarVoc[]>(`/vocs/${vocId}/similar`, params);
      return response.data;
    },
    enabled: enabled && !!vocId,
  });
}

/**
 * @description Hook for fetching paginated similar VOCs
 * Used for the full list page with pagination support
 */
export function useSimilarVocsPaginated(
  vocId: number,
  { page = 0, size = 20, minSimilarity = 0 }: { page?: number; size?: number; minSimilarity?: number } = {}
) {
  return useQuery({
    queryKey: [SIMILAR_VOCS_QUERY_KEY, 'paginated', vocId, page, size, minSimilarity],
    queryFn: async () => {
      const response = await api.get<PageResponse<SimilarVoc>>(`/vocs/${vocId}/similar`, {
        page,
        size,
        minSimilarity,
      });
      return response.data;
    },
    enabled: !!vocId,
  });
}
