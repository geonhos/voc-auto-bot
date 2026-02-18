'use client';

import { useState, useCallback } from 'react';

import { api } from '@/lib/api/client';
import { downloadAsExcel, mapVocToExportRow } from '@/lib/exportUtils';
import type { Voc, VocListParams, PageResponse } from '@/types';

/**
 * Hook to export the current filtered VOC list as an Excel file.
 * Fetches all pages matching the current filters before exporting.
 */
export function useExportVocs() {
  const [isExporting, setIsExporting] = useState(false);

  const exportVocs = useCallback(async (params: Omit<VocListParams, 'page' | 'size'>) => {
    setIsExporting(true);
    try {
      const response = await api.get<PageResponse<Voc>>('/vocs', {
        ...params,
        page: 0,
        size: 5000,
      } as Record<string, unknown>);

      const vocs = response.data.content;
      if (vocs.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
      }

      const rows = vocs.map(mapVocToExportRow);
      const timestamp = new Date().toISOString().slice(0, 10);
      await downloadAsExcel(rows, `VOC_목록_${timestamp}`, 'VOC 목록');
    } catch (error) {
      console.error('Export failed:', error);
      alert('내보내기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportVocs, isExporting };
}
