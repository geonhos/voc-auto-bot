'use client';

import { useState } from 'react';
import { VocTable } from '@/components/voc/VocTable';
import { VocSearchFilter } from '@/components/voc/VocSearchFilter';
import { useVocs } from '@/hooks/useVocs';
import type { VocFilterState, VocListParams } from '@/types';

/**
 * VOC Table ViewModel Hook
 * Manages VOC list state, filtering, and pagination
 */
function useVocTableViewModel() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState<VocFilterState>({
    status: [],
    priority: [],
  });
  const [search, setSearch] = useState('');

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
  };

  const { data: vocs, isLoading, error } = useVocs(params);

  const handleFilterChange = (newFilters: VocFilterState) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(0); // Reset to first page when search changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(0); // Reset to first page when page size changes
  };

  return {
    vocs,
    isLoading,
    error,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  };
}

export default function VocTablePage() {
  const {
    vocs,
    isLoading,
    error,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useVocTableViewModel();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">VOC 목록</h1>
        <p className="mt-2 text-sm text-gray-600">
          고객의 소리를 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <VocSearchFilter onFilterChange={handleFilterChange} onSearch={handleSearch} />

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
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
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
