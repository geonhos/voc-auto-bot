import type {
  Voc,
  VocStatus,
  VocPriority,
  VocChannel,
  Assignee,
  VocAttachment,
  VocMemo,
  AiAnalysis,
  SimilarVoc,
} from '@/types/voc';
import type { Category } from '@/types/category';
import type { User, UserRole } from '@/types/user';
import type {
  DashboardData,
  KpiData,
  KpiChangeData,
  TrendData,
  CategoryStats,
  StatusDistribution,
} from '@/types/statistics';
import type { LoginResponse, UserInfo } from '@/types/auth';

/**
 * @description Mock Factory Pattern for E2E Tests
 * Provides factory functions to create test data with sensible defaults
 * and optional overrides for specific test scenarios.
 */

// ============================================================================
// User & Auth Factories
// ============================================================================

/**
 * Creates a mock user with default values
 * @param overrides - Partial user data to override defaults
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    username: 'test.user',
    name: '테스트 사용자',
    email: 'test@example.com',
    role: 'OPERATOR' as UserRole,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock assignee for VOC assignment
 * @param overrides - Partial assignee data to override defaults
 */
export function createMockAssignee(overrides?: Partial<Assignee>): Assignee {
  return {
    id: 1,
    name: '김철수',
    username: 'kim.cs',
    ...overrides,
  };
}

/**
 * Creates a mock user info for authentication
 * @param overrides - Partial user info data to override defaults
 */
export function createMockUserInfo(overrides?: Partial<UserInfo>): UserInfo {
  return {
    id: 1,
    username: 'test.user',
    name: '테스트 사용자',
    email: 'test@example.com',
    role: 'OPERATOR' as UserRole,
    ...overrides,
  };
}

/**
 * Creates a mock authentication response
 * @param overrides - Partial auth response data to override defaults
 */
export function createMockAuthResponse(overrides?: Partial<LoginResponse>): LoginResponse {
  return {
    accessToken: 'mock-access-token-12345',
    refreshToken: 'mock-refresh-token-67890',
    user: createMockUserInfo(),
    ...overrides,
  };
}

// ============================================================================
// Category Factories
// ============================================================================

/**
 * Creates a mock category
 * @param overrides - Partial category data to override defaults
 */
export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: 1,
    name: '제품 문의',
    code: 'PRODUCT',
    level: 1,
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Creates an array of mock categories
 * @param count - Number of categories to create
 */
export function createMockCategories(count = 5): Category[] {
  const categories = [
    { id: 1, name: '제품 문의', code: 'PRODUCT' },
    { id: 2, name: '서비스 문의', code: 'SERVICE' },
    { id: 3, name: '불만사항', code: 'COMPLAINT' },
    { id: 4, name: '제안사항', code: 'SUGGESTION' },
    { id: 5, name: '기타', code: 'OTHER' },
  ];

  return categories.slice(0, count).map((cat) => createMockCategory(cat));
}

// ============================================================================
// VOC Factories
// ============================================================================

/**
 * Creates a mock VOC attachment
 * @param overrides - Partial attachment data to override defaults
 */
export function createMockAttachment(overrides?: Partial<VocAttachment>): VocAttachment {
  return {
    id: 1,
    originalFileName: 'document.pdf',
    storedFileName: 'stored-uuid-document.pdf',
    fileSize: 1024 * 500, // 500KB
    mimeType: 'application/pdf',
    downloadUrl: '/api/voc/attachments/1',
    createdAt: '2026-01-25T10:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock VOC memo
 * @param overrides - Partial memo data to override defaults
 */
export function createMockMemo(overrides?: Partial<VocMemo>): VocMemo {
  return {
    id: 1,
    content: '담당자가 확인 중입니다.',
    isInternal: false,
    author: {
      id: 1,
      name: '김철수',
    },
    createdAt: '2026-01-25T11:00:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock AI analysis result
 * @param overrides - Partial AI analysis data to override defaults
 */
export function createMockAiAnalysis(overrides?: Partial<AiAnalysis>): AiAnalysis {
  return {
    summary: '고객이 제품 배송 지연에 대한 불만을 제기하고 있습니다.',
    sentiment: 'NEGATIVE',
    suggestedCategoryId: 1,
    suggestedCategoryName: '제품 문의',
    confidence: 0.85,
    keywords: ['배송', '지연', '불만'],
    analyzedAt: '2026-01-25T10:05:00Z',
    ...overrides,
  };
}

/**
 * Creates a mock VOC with default values
 * @param overrides - Partial VOC data to override defaults
 */
export function createMockVoc(overrides?: Partial<Voc>): Voc {
  return {
    id: 1,
    ticketId: 'VOC-20260125-0001',
    title: '제품 배송 지연',
    content: '주문한 제품이 예정일보다 3일이나 지연되고 있습니다. 빠른 확인 부탁드립니다.',
    status: 'RECEIVED' as VocStatus,
    priority: 'HIGH' as VocPriority,
    channel: 'WEB' as VocChannel,
    customerName: '홍길동',
    customerEmail: 'hong@example.com',
    customerPhone: '010-1234-5678',
    category: createMockCategory(),
    attachments: [],
    memos: [],
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
    ...overrides,
  };
}

/**
 * Creates an array of mock VOCs with different statuses
 * @param count - Number of VOCs to create
 */
export function createMockVocs(count = 5): Voc[] {
  const templates: Partial<Voc>[] = [
    {
      id: 1,
      ticketId: 'VOC-20260125-0001',
      title: '제품 배송 지연',
      status: 'RECEIVED',
      priority: 'HIGH',
    },
    {
      id: 2,
      ticketId: 'VOC-20260125-0002',
      title: '서비스 문의 사항',
      status: 'ASSIGNED',
      priority: 'MEDIUM',
      assignee: createMockAssignee(),
    },
    {
      id: 3,
      ticketId: 'VOC-20260125-0003',
      title: '불만사항 접수',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assignee: createMockAssignee({ id: 2, name: '이영희', username: 'lee.yh' }),
    },
    {
      id: 4,
      ticketId: 'VOC-20260124-0015',
      title: '제안사항입니다',
      status: 'RESOLVED',
      priority: 'LOW',
      resolvedAt: '2026-01-24T18:00:00Z',
    },
    {
      id: 5,
      ticketId: 'VOC-20260124-0010',
      title: '기타 문의',
      status: 'CLOSED',
      priority: 'MEDIUM',
      resolvedAt: '2026-01-24T16:00:00Z',
      closedAt: '2026-01-24T17:00:00Z',
    },
  ];

  return templates.slice(0, count).map((template) => createMockVoc(template));
}

/**
 * Creates a mock similar VOC
 * @param overrides - Partial similar VOC data to override defaults
 */
export function createMockSimilarVoc(overrides?: Partial<SimilarVoc>): SimilarVoc {
  return {
    id: 2,
    ticketId: 'VOC-20260124-0020',
    title: '제품 배송 관련 문의',
    status: 'RESOLVED' as VocStatus,
    similarity: 0.87,
    createdAt: '2026-01-24T15:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Dashboard Statistics Factories
// ============================================================================

/**
 * Creates mock KPI change data
 * @param overrides - Partial KPI change data to override defaults
 */
export function createMockKpiChange(overrides?: Partial<KpiChangeData>): KpiChangeData {
  return {
    value: 8.5,
    type: 'increase',
    count: 98,
    ...overrides,
  };
}

/**
 * Creates mock KPI data for dashboard
 * @param overrides - Partial KPI data to override defaults
 */
export function createMockKpiData(overrides?: Partial<KpiData>): KpiData {
  return {
    totalVocs: 1250,
    resolvedVocs: 1092,
    pendingVocs: 158,
    avgResolutionTimeHours: 24.5,
    resolutionRate: 87.3,
    todayVocs: 50,
    weekVocs: 350,
    monthVocs: 1250,
    totalVocsChange: createMockKpiChange({ value: 8.5, type: 'increase', count: 98 }),
    avgResolutionTimeChange: createMockKpiChange({ value: -12.3, type: 'decrease' }),
    resolutionRateChange: createMockKpiChange({ value: 2.1, type: 'increase' }),
    pendingVocsChange: createMockKpiChange({ value: 0, type: 'neutral', count: 0 }),
    ...overrides,
  };
}

/**
 * Creates mock trend data point
 * @param overrides - Partial trend data to override defaults
 */
export function createMockTrendData(overrides?: Partial<TrendData>): TrendData {
  return {
    date: '2024-01-01',
    received: 45,
    resolved: 38,
    pending: 7,
    ...overrides,
  };
}

/**
 * Creates an array of mock trend data for time series chart
 * @param days - Number of days to generate
 */
export function createMockTrendDataArray(days = 7): TrendData[] {
  const baseDate = new Date('2024-01-01');
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    return createMockTrendData({
      date: date.toISOString().split('T')[0],
      received: Math.floor(Math.random() * 30) + 40,
      resolved: Math.floor(Math.random() * 30) + 35,
      pending: Math.floor(Math.random() * 10) - 3,
    });
  });
}

/**
 * Creates mock category statistics
 * @param overrides - Partial category stats to override defaults
 */
export function createMockCategoryStats(overrides?: Partial<CategoryStats>): CategoryStats {
  return {
    categoryId: 1,
    categoryName: '제품 문의',
    count: 450,
    percentage: 36.0,
    ...overrides,
  };
}

/**
 * Creates an array of mock category statistics
 * @param count - Number of categories to generate
 */
export function createMockCategoryStatsArray(count = 5): CategoryStats[] {
  const templates = [
    { categoryId: 1, categoryName: '제품 문의', count: 450, percentage: 36.0 },
    { categoryId: 2, categoryName: '기술 지원', count: 325, percentage: 26.0 },
    { categoryId: 3, categoryName: '배송 문의', count: 275, percentage: 22.0 },
    { categoryId: 4, categoryName: '환불 요청', count: 125, percentage: 10.0 },
    { categoryId: 5, categoryName: '기타', count: 75, percentage: 6.0 },
  ];

  return templates.slice(0, count).map((template) => createMockCategoryStats(template));
}

/**
 * Creates mock status distribution data
 * @param overrides - Partial status distribution to override defaults
 */
export function createMockStatusDistribution(
  overrides?: Partial<StatusDistribution>
): StatusDistribution {
  return {
    status: 'NEW',
    statusLabel: '신규',
    count: 158,
    percentage: 12.6,
    ...overrides,
  };
}

/**
 * Creates an array of mock status distributions
 */
export function createMockStatusDistributionArray(): StatusDistribution[] {
  const templates = [
    { status: 'NEW', statusLabel: '신규', count: 158, percentage: 12.6 },
    { status: 'IN_PROGRESS', statusLabel: '처리중', count: 305, percentage: 24.4 },
    { status: 'RESOLVED', statusLabel: '해결', count: 687, percentage: 55.0 },
    { status: 'REJECTED', statusLabel: '거부', count: 100, percentage: 8.0 },
  ];

  return templates.map((template) => createMockStatusDistribution(template));
}

/**
 * Creates complete mock dashboard data
 * @param overrides - Partial dashboard data to override defaults
 */
export function createMockDashboardStats(overrides?: Partial<DashboardData>): DashboardData {
  return {
    kpi: createMockKpiData(),
    trend: createMockTrendDataArray(7),
    categoryStats: createMockCategoryStatsArray(),
    statusDistribution: createMockStatusDistributionArray(),
    channelStats: [],
    priorityStats: [],
    topAssignees: [],
    ...overrides,
  };
}

// ============================================================================
// API Response Wrapper
// ============================================================================

/**
 * Wraps data in a standard API response format
 * @param data - The data to wrap
 * @param success - Whether the request was successful
 */
export function createMockApiResponse<T>(data: T, success = true) {
  return {
    success,
    data: success ? data : null,
    error: success ? null : { message: 'API Error', code: 'INTERNAL_ERROR' },
  };
}

/**
 * Creates a paginated API response
 * @param content - The page content
 * @param page - Current page number
 * @param size - Page size
 * @param totalElements - Total number of elements
 */
export function createMockPageResponse<T>(
  content: T[],
  page = 0,
  size = 10,
  totalElements = content.length
) {
  return {
    content,
    page,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    first: page === 0,
    last: page === Math.ceil(totalElements / size) - 1,
    empty: content.length === 0,
  };
}
