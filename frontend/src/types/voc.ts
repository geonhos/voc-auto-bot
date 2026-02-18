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

/**
 * 신뢰도 레벨 타입
 */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * 분석 방법 타입
 */
export type AnalysisMethod = 'rag' | 'rule_based' | 'direct_llm';

/**
 * 신뢰도 점수 breakdown
 */
export interface ConfidenceBreakdown {
  vectorMatchScore: number;
  similarityScore: number;
  responseCompleteness: number;
  categoryMatchScore: number;
}

/**
 * 신뢰도 상세 정보
 */
export interface ConfidenceDetails {
  level: ConfidenceLevel;
  score: number;
  breakdown?: ConfidenceBreakdown;
  factors: string[];
}

export type Sentiment = 'positive' | 'negative' | 'neutral';

export function getSentimentLabel(sentiment: Sentiment | null | undefined): string {
  if (!sentiment) return '미분석';
  switch (sentiment) {
    case 'positive': return '긍정';
    case 'negative': return '부정';
    case 'neutral': return '중립';
    default: return '미분석';
  }
}

export function getSentimentColor(sentiment: Sentiment | null | undefined): string {
  if (!sentiment) return 'bg-gray-100 text-gray-600';
  switch (sentiment) {
    case 'positive': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'neutral': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-600';
  }
}

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
  sentiment?: Sentiment;
  sentimentConfidence?: number;
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
  // Enhanced fields for confidence display
  confidenceLevel?: ConfidenceLevel;
  analysisMethod?: AnalysisMethod;
  vectorMatchCount?: number;
  confidenceDetails?: ConfidenceDetails;
  // Metrics request ID for feedback
  requestId?: string;
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
 * @param level - 신뢰도 레벨 (null/undefined인 경우 'gray' 반환)
 */
export function getConfidenceLevelColor(level: ConfidenceLevel | null | undefined): string {
  if (!level) return 'gray';
  switch (level) {
    case 'HIGH':
      return 'green';
    case 'MEDIUM':
      return 'yellow';
    case 'LOW':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * 신뢰도 점수를 기반으로 레벨 결정
 * @param score - 신뢰도 점수 (0.0 ~ 1.0, null/undefined인 경우 'LOW' 반환)
 */
export function getConfidenceLevelFromScore(score: number | null | undefined): ConfidenceLevel {
  if (score == null || isNaN(score)) return 'LOW';
  if (score >= 0.7) return 'HIGH';
  if (score >= 0.4) return 'MEDIUM';
  return 'LOW';
}

/**
 * 분석 방법에 대한 한국어 레이블 반환
 * @param method - 분석 방법 (null/undefined인 경우 '알 수 없음' 반환)
 */
export function getAnalysisMethodLabel(method: AnalysisMethod | null | undefined): string {
  if (!method) return '알 수 없음';
  switch (method) {
    case 'rag':
      return 'RAG 기반';
    case 'rule_based':
      return '규칙 기반';
    case 'direct_llm':
      return 'LLM 직접';
    default:
      return '알 수 없음';
  }
}

/**
 * 신뢰도가 낮은지 확인
 * @param analysis - AI 분석 결과 (null/undefined인 경우 false 반환)
 */
export function isLowConfidence(analysis: AiAnalysis | null | undefined): boolean {
  if (!analysis) return false;
  if (analysis.confidenceLevel === 'LOW') return true;
  if (analysis.confidence != null && analysis.confidence < 0.4) return true;
  return false;
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
  customerEmail?: string;
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

// Bulk operation types
export interface BulkStatusChangeRequest {
  vocIds: number[];
  status: VocStatus;
  reason?: string;
}

export interface BulkAssignRequest {
  vocIds: number[];
  assigneeId: number;
}

export interface BulkPriorityChangeRequest {
  vocIds: number[];
  priority: VocPriority;
}

export interface BulkOperationResponse {
  successCount: number;
  failedIds: number[];
  errors: Record<number, string>;
}
