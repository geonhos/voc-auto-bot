/**
 * Create an Excel workbook from data and trigger browser download.
 * Uses dynamic import to avoid bundling xlsx in the initial chunk.
 */
export async function downloadAsExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1',
) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/** Korean column name mapping for VOC export */
export const VOC_COLUMN_MAP: Record<string, string> = {
  ticketId: '티켓ID',
  title: '제목',
  status: '상태',
  priority: '우선순위',
  category: '카테고리',
  assignee: '담당자',
  createdAt: '등록일',
  updatedAt: '업데이트일',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: '신규',
  IN_PROGRESS: '처리중',
  PENDING: '보류',
  RESOLVED: '해결완료',
  CLOSED: '종료',
  REJECTED: '반려',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

export interface VocExportRow {
  [key: string]: string;
}

/**
 * Convert raw VOC data to a flat export-ready format with Korean headers.
 */
export function mapVocToExportRow(voc: {
  ticketId: string;
  title: string;
  status: string;
  priority: string;
  category?: { name: string } | null;
  assignee?: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}): VocExportRow {
  return {
    [VOC_COLUMN_MAP.ticketId]: voc.ticketId,
    [VOC_COLUMN_MAP.title]: voc.title,
    [VOC_COLUMN_MAP.status]: STATUS_LABELS[voc.status] ?? voc.status,
    [VOC_COLUMN_MAP.priority]: PRIORITY_LABELS[voc.priority] ?? voc.priority,
    [VOC_COLUMN_MAP.category]: voc.category?.name ?? '미분류',
    [VOC_COLUMN_MAP.assignee]: voc.assignee?.name ?? '미배정',
    [VOC_COLUMN_MAP.createdAt]: voc.createdAt,
    [VOC_COLUMN_MAP.updatedAt]: voc.updatedAt,
  };
}
