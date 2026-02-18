'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';

import { VocSearchFilter } from '@/components/voc/VocSearchFilter';
import { VocTable } from '@/components/voc/VocTable';
import { useVocFilterParams } from '@/hooks/useVocFilterParams';
import { useVocs } from '@/hooks/useVocs';
import type { VocFilterState, VocListParams } from '@/types';

function VocTableContent() {
  const { getFiltersFromParams, setFiltersToParams } = useVocFilterParams();

  const [filters, setFilters] = useState<VocFilterState>(() => getFiltersFromParams());
  const [search, setSearch] = useState(() => getFiltersFromParams().search ?? '');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC' | undefined>();

  // Sync filters to URL
  useEffect(() => {
    setFiltersToParams(filters, search);
  }, [filters, search, setFiltersToParams]);

  const params: VocListParams = {
    page,
    size,
    ...(filters.status.length > 0 && { status: filters.status }),
    ...(filters.priority.length > 0 && { priority: filters.priority }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    ...(filters.fromDate && { fromDate: filters.fromDate }),
    ...(filters.toDate && { toDate: filters.toDate }),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortDirection && { sortDirection }),
  };

  const { data: vocs, isLoading, error } = useVocs(params);

  const handleFilterChange = useCallback((newFilters: VocFilterState) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handleSearch = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(0);
  }, []);

  const handleSortChange = useCallback((newSortBy: string, newSortDirection: 'ASC' | 'DESC') => {
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
  }, []);

  return (
    <>
      <VocSearchFilter
        initialFilters={filters}
        initialSearch={search}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {error ? (
        <div className="bg-danger/10 dark:bg-danger/5 border border-danger/20 rounded-xl p-4 text-danger">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      ) : (
        <VocTable
          vocs={
            vocs || {
              content: [],
              page: 0,
              size: 10,
              totalElements: 0,
              totalPages: 0,
              first: true,
              last: true,
              empty: true,
            }
          }
          isLoading={isLoading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSortChange={handleSortChange}
        />
      )}
    </>
  );
}

export default function VocTablePage() {
  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">VOC 리스트</h1>
          <p className="text-slate-500 dark:text-slate-400">
            VOC 목록을 테이블 형태로 조회하고 관리하세요.
          </p>
        </div>

        <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <VocTableContent />
        </Suspense>
      </div>
    </div>
  );
}
