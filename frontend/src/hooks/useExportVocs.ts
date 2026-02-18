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
      // Fetch a large page to get all filtered results
      const response = await api.get<PageResponse<Voc>>('/vocs', {
        ...params,
        page: 0,
        size: 10000,
      } as Record<string, unknown>);

      const vocs = response.data.content;
      if (vocs.length === 0) return;

      const rows = vocs.map(mapVocToExportRow);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadAsExcel(rows, `VOC_목록_${timestamp}`, 'VOC 목록');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportVocs, isExporting };
}
