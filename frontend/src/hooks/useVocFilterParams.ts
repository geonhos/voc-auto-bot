'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import type { VocFilterState, VocStatus, VocPriority } from '@/types';

/**
 * Syncs VocFilterState with URL search params for shareable filter URLs.
 */
export function useVocFilterParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getFiltersFromParams = useCallback((): VocFilterState => {
    const status = searchParams.getAll('status') as VocStatus[];
    const priority = searchParams.getAll('priority') as VocPriority[];
    const categoryId = searchParams.get('categoryId');
    const assigneeId = searchParams.get('assigneeId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');

    return {
      status,
      priority,
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(assigneeId && { assigneeId: Number(assigneeId) }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(search && { search }),
    };
  }, [searchParams]);

  const setFiltersToParams = useCallback(
    (filters: VocFilterState, search?: string) => {
      const params = new URLSearchParams();

      filters.status.forEach((s) => params.append('status', s));
      filters.priority.forEach((p) => params.append('priority', p));
      if (filters.categoryId) params.set('categoryId', String(filters.categoryId));
      if (filters.assigneeId) params.set('assigneeId', String(filters.assigneeId));
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      if (search) params.set('search', search);

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname],
  );

  const page = Number(searchParams.get('page') || '0');
  const size = Number(searchParams.get('size') || '10');
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortDirection = (searchParams.get('sortDirection') as 'ASC' | 'DESC') || undefined;

  return { getFiltersFromParams, setFiltersToParams, page, size, sortBy, sortDirection };
}
