'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { VocStatusHistoryItem } from '@/types';

interface StatusHistoryApiItem {
  id: number;
  previousStatus: string;
  previousStatusLabel: string;
  newStatus: string;
  newStatusLabel: string;
  changedBy: number | null;
  changeReason: string | null;
  createdAt: string;
}

function mapToHistoryItem(item: StatusHistoryApiItem): VocStatusHistoryItem {
  return {
    id: item.id,
    status: item.newStatus as VocStatusHistoryItem['status'],
    statusLabel: item.newStatusLabel,
    changedAt: item.createdAt,
    changedBy: item.changeReason ?? undefined,
  };
}

export function useVocStatusHistory(vocId: number) {
  return useQuery({
    queryKey: ['vocStatusHistory', vocId],
    queryFn: async () => {
      const response = await api.get<StatusHistoryApiItem[]>(`/vocs/${vocId}/history`);
      return (response.data ?? []).map(mapToHistoryItem);
    },
    enabled: !!vocId,
  });
}
