'use client';

import { useState } from 'react';

import type { VocStatus, VocPriority, VocFilterState } from '@/types';

interface VocSearchFilterProps {
  onFilterChange: (filters: VocFilterState) => void;
  onSearch: (search: string) => void;
}

const statusOptions: { value: VocStatus; label: string }[] = [
  { value: 'RECEIVED', label: '접수' },
  { value: 'ASSIGNED', label: '배정됨' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'PENDING', label: '대기' },
  { value: 'RESOLVED', label: '해결' },
  { value: 'CLOSED', label: '종료' },
  { value: 'REJECTED', label: '거부' },
];

const priorityOptions: { value: VocPriority; label: string }[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
  { value: 'URGENT', label: '긴급' },
];

export function VocSearchFilter({ onFilterChange, onSearch }: VocSearchFilterProps) {
  const [filters, setFilters] = useState<VocFilterState>({
    status: [],
    priority: [],
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusChange = (status: VocStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriorityChange = (priority: VocPriority) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter((p) => p !== priority)
      : [...filters.priority, priority];

    const newFilters = { ...filters, priority: newPriority };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (field: 'fromDate' | 'toDate', value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleClearFilters = () => {
    const clearedFilters: VocFilterState = {
      status: [],
      priority: [],
    };
    setFilters(clearedFilters);
    setSearchInput('');
    onFilterChange(clearedFilters);
    onSearch('');
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.fromDate ||
    filters.toDate ||
    searchInput;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="제목 또는 내용으로 검색..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          필터
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            초기화
          </button>
        )}
      </div>

      {showFilters && (
        <div className="border-t pt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.status.includes(option.value)}
                    onChange={() => handleStatusChange(option.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(option.value)}
                    onChange={() => handlePriorityChange(option.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => handleDateChange('fromDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => handleDateChange('toDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
