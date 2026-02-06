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
 * 상태별 전이 가능한 상태 목록
 */
export const ALLOWED_TRANSITIONS: Record<VocStatus, VocStatus[]> = {
  NEW: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  PENDING: ['RESOLVED', 'REJECTED'],
  RESOLVED: [], // 종료 상태
  REJECTED: [], // 종료 상태
  CLOSED: [],   // 종료 상태
};

/**
 * 주어진 상태가 최종 상태인지 확인합니다.
 * 최종 상태는 다른 상태로 변경할 수 없습니다.
 */
export function isTerminalStatus(status: VocStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * 특정 상태에서 다른 상태로 전이가 가능한지 확인합니다.
 * 같은 상태로의 전이는 허용되지 않습니다.
 */
export function canTransitionTo(from: VocStatus, to: VocStatus): boolean {
  if (from === to) return false; // 같은 상태로 전이 불가
  return ALLOWED_TRANSITIONS[from].includes(to);
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

/**
 * 신뢰도 레벨 타입
 * HIGH: 0.7 이상 (RAG 분석 성공)
 * MEDIUM: 0.4-0.7 (규칙 기반 또는 제한된 RAG)
 * LOW: 0.4 미만 (직접 LLM 또는 분석 실패)
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * 분석 방법 타입
 * rag: RAG 기반 분석 (벡터 DB + LLM)
 * rule_based: 규칙 기반 분석 (템플릿 매칭)
 * direct_llm: 직접 LLM 분석 (컨텍스트 없음)
 */
export type AnalysisMethod = 'rag' | 'rule_based' | 'direct_llm';

/**
 * 신뢰도 계산 breakdown 상세 정보
 */
export interface ConfidenceBreakdown {
  vectorMatchScore: number;
  vectorMatchCountScore: number;
  llmResponseScore: number;
  methodWeight: number;
}

/**
 * 신뢰도 상세 정보
 */
export interface ConfidenceDetails {
  level: ConfidenceLevel;
  factors: string[];
  breakdown?: ConfidenceBreakdown;
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
  // Enhanced fields for confidence reporting
  analysisMethod?: AnalysisMethod;
  confidenceLevel?: ConfidenceLevel;
  confidenceDetails?: ConfidenceDetails;
  vectorMatchCount?: number;
}

export interface RelatedLog {
  timestamp: string;
  logLevel: string;
  serviceName: string;
  message: string;
  relevanceScore: number;
}

/**
 * 신뢰도 레벨에 따른 색상 반환
 */
export function getConfidenceLevelColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'HIGH':
      return 'success';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'danger';
    default:
      return 'slate';
  }
}

/**
 * 분석 방법의 한국어 라벨 반환
 */
export function getAnalysisMethodLabel(method: AnalysisMethod): string {
  switch (method) {
    case 'rag':
      return 'RAG 분석';
    case 'rule_based':
      return '규칙 기반';
    case 'direct_llm':
      return '직접 LLM';
    default:
      return '알 수 없음';
  }
}

/**
 * 신뢰도 레벨의 한국어 라벨 반환
 */
export function getConfidenceLevelLabel(level: ConfidenceLevel): string {
  switch (level) {
    case 'HIGH':
      return '높음';
    case 'MEDIUM':
      return '보통';
    case 'LOW':
      return '낮음';
    default:
      return '알 수 없음';
  }
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
