'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { Voc, VocListParams, PageResponse } from '@/types';

const UNRESOLVED_STATUSES = ['NEW', 'IN_PROGRESS', 'PENDING'] as const;
const DEBOUNCE_MS = 500;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UseCustomerVocHistoryReturn {
  unresolvedVocs: Voc[];
  customerName: string | null;
  isLoading: boolean;
  unresolvedCount: number;
}

export function useCustomerVocHistory(email: string | undefined): UseCustomerVocHistoryReturn {
  const [debouncedEmail, setDebouncedEmail] = useState('');

  useEffect(() => {
    if (!email || !EMAIL_REGEX.test(email)) {
      setDebouncedEmail('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedEmail(email);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [email]);

  const enabled = !!debouncedEmail && EMAIL_REGEX.test(debouncedEmail);

  const { data, isLoading } = useQuery({
    queryKey: ['customer-voc-history', debouncedEmail],
    queryFn: async () => {
      const params: VocListParams = {
        customerEmail: debouncedEmail,
        size: 50,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      };
      const response = await api.get<PageResponse<Voc>>('/vocs', params as Record<string, unknown>);
      return response.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const allVocs = data?.content ?? [];
  const unresolvedVocs = allVocs.filter((voc) =>
    (UNRESOLVED_STATUSES as readonly string[]).includes(voc.status)
  );
  const customerName = allVocs.length > 0 ? allVocs[0].customerName : null;

  return {
    unresolvedVocs,
    customerName,
    isLoading: enabled && isLoading,
    unresolvedCount: unresolvedVocs.length,
  };
}
