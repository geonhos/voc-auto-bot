export type VocStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

/**
 * 최종 상태(Terminal Status) 목록
 * 이 상태들은 다른 상태로 전이할 수 없습니다.
 */
export const TERMINAL_STATUSES: VocStatus[] = ['RESOLVED', 'REJECTED', 'CLOSED'];

/**
 * 주어진 상태가 최종 상태인지 확인합니다.
 * 최종 상태는 다른 상태로 변경할 수 없습니다.
 */
export function isTerminalStatus(status: VocStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export type VocPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type VocChannel = 'WEB' | 'EMAIL' | 'PHONE' | 'CHAT' | 'SNS' | 'OTHER';

export interface Voc {
  id: number;
  ticketId: string;
  title: string;
  content: string;
  status: VocStatus;
  priority: VocPriority;
  channel: VocChannel;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category?: VocCategory;
  suggestedCategory?: VocCategory;
  assignee?: Assignee;
  dueDate?: string;
  resolvedAt?: string;
  closedAt?: string;
  processingNote?: string;
  rejectReason?: string;
  attachments: VocAttachment[];
  memos: VocMemo[];
  aiAnalysis?: AiAnalysis;
  createdAt: string;
  updatedAt: string;
}

// Use Category from category.ts
// This simplified VocCategory is used in VOC responses
export interface VocCategory {
  id: number;
  name: string;
  code: string;
}

export interface Assignee {
  id: number;
  name: string;
  username: string;
}

export interface VocAttachment {
  id: number;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  createdAt: string;
}

export interface VocMemo {
  id: number;
  content: string;
  isInternal: boolean;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

export interface AiAnalysis {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  summary?: string;
  confidence?: number;
  keywords?: string[];
  possibleCauses?: string[];
  relatedLogs?: RelatedLog[];
  recommendation?: string;
  errorMessage?: string;
  analyzedAt?: string;
}

export interface RelatedLog {
  timestamp: string;
  logLevel: string;
  serviceName: string;
  message: string;
  relevanceScore: number;
}

export interface CreateVocRequest {
  title: string;
  content: string;
  channel: VocChannel;
  status?: VocStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  categoryId?: number;
  priority?: VocPriority;
}

export interface UpdateVocRequest {
  title?: string;
  content?: string;
  categoryId?: number;
  priority?: VocPriority;
  dueDate?: string;
}

export interface AssignVocRequest {
  assigneeId: number;
}

export interface ChangeStatusRequest {
  status: VocStatus;
  processingNote?: string;
  rejectReason?: string;
}

export interface AddMemoRequest {
  content: string;
  isInternal: boolean;
}

export interface VocListParams {
  page?: number;
  size?: number;
  status?: VocStatus | VocStatus[];
  priority?: VocPriority | VocPriority[];
  channel?: VocChannel;
  categoryId?: number;
  assigneeId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface VocFilterState {
  status: VocStatus[];
  priority: VocPriority[];
  categoryId?: number;
  assigneeId?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface VocStatusLookupRequest {
  ticketId: string;
  customerEmail: string;
}

export interface VocStatusHistoryItem {
  id?: number;
  status: VocStatus;
  statusLabel: string;
  changedAt: string;
  changedBy?: string;
}

export interface VocStatusLookupResponse {
  ticketId: string;
  title: string;
  status: VocStatus;
  statusLabel: string;
  priority?: VocPriority;
  category?: string;
  statusHistory?: VocStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SimilarVoc {
  id: number;
  ticketId: string;
  title: string;
  status: VocStatus;
  similarity: number;
  createdAt: string;
}
