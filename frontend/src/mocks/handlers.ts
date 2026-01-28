import { http, HttpResponse, delay } from 'msw';

import type {
  LoginRequest,
  LoginResponse,
  User,
  Category,
  Voc,
  VocStatus,
  EmailTemplate,
  DashboardData,
} from '@/types';

const API_BASE = '/api/v1';

// Mock data
const mockUser: User = {
  id: 1,
  username: 'admin',
  name: '관리자',
  email: 'admin@example.com',
  role: 'ADMIN',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockCategories: Category[] = [
  {
    id: 1,
    name: '제품 문의',
    code: 'PRODUCT',
    level: 0,
    sortOrder: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    children: [
      {
        id: 2,
        name: '기능 문의',
        code: 'PRODUCT_FEATURE',
        parentId: 1,
        level: 1,
        sortOrder: 1,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 3,
        name: '가격 문의',
        code: 'PRODUCT_PRICE',
        parentId: 1,
        level: 1,
        sortOrder: 2,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: 4,
    name: '불만/개선',
    code: 'COMPLAINT',
    level: 0,
    sortOrder: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    children: [],
  },
];

const mockVocs: Voc[] = [
  {
    id: 1,
    ticketId: 'VOC-2024-0001',
    title: '제품 배송 지연 문의',
    content: '주문한 상품이 아직 도착하지 않았습니다.',
    status: 'NEW',
    priority: 'NORMAL',
    channel: 'WEB',
    customerName: '홍길동',
    customerEmail: 'hong@example.com',
    attachments: [],
    memos: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    ticketId: 'VOC-2024-0002',
    title: '환불 요청',
    content: '제품 불량으로 환불을 요청합니다.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    channel: 'PHONE',
    customerName: '김철수',
    customerEmail: 'kim@example.com',
    assignee: { id: 1, name: '관리자', username: 'admin' },
    attachments: [],
    memos: [],
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

// Handlers
export const handlers = [
  // Auth
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as LoginRequest;

    if (body.email === 'admin@voc-auto-bot.com' && body.password === 'Admin123!') {
      const response: LoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
      };
      return HttpResponse.json({ success: true, data: response });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '아이디 또는 비밀번호가 일치하지 않습니다',
        },
      },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/auth/refresh`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
      },
    });
  }),

  http.post(`${API_BASE}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({ success: true, data: null });
  }),

  // Users
  http.get(`${API_BASE}/users`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: [mockUser],
      page: 1,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });
  }),

  http.get(`${API_BASE}/users/me`, async () => {
    await delay(200);
    return HttpResponse.json({ success: true, data: mockUser });
  }),

  // Categories
  http.get(`${API_BASE}/categories/tree`, async () => {
    await delay(300);
    return HttpResponse.json({ success: true, data: mockCategories });
  }),

  http.get(`${API_BASE}/categories`, async () => {
    await delay(300);
    const flatCategories = mockCategories.flatMap((cat) => [cat, ...(cat.children || [])]);
    return HttpResponse.json({ success: true, data: flatCategories });
  }),

  // VOCs
  http.get(`${API_BASE}/vocs`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as VocStatus | null;

    let filteredVocs = mockVocs;
    if (status) {
      filteredVocs = mockVocs.filter((v) => v.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: {
        content: filteredVocs,
        page: 0,
        size: 20,
        totalElements: filteredVocs.length,
        totalPages: 1,
        first: true,
        last: true,
        empty: filteredVocs.length === 0,
      },
    });
  }),

  http.get(`${API_BASE}/vocs/:id`, async ({ params }) => {
    await delay(300);
    const id = Number(params.id);
    const voc = mockVocs.find((v) => v.id === id);

    if (!voc) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VOC_NOT_FOUND', message: 'VOC를 찾을 수 없습니다' },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: voc });
  }),

  http.post(`${API_BASE}/vocs`, async ({ request }) => {
    await delay(500);
    const body = await request.json();
    const newVoc: Voc = {
      id: mockVocs.length + 1,
      ticketId: `VOC-2024-${String(mockVocs.length + 1).padStart(4, '0')}`,
      ...(body as Omit<Voc, 'id' | 'ticketId' | 'attachments' | 'memos' | 'createdAt' | 'updatedAt'>),
      status: 'NEW',
      attachments: [],
      memos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockVocs.push(newVoc);
    return HttpResponse.json({ success: true, data: newVoc }, { status: 201 });
  }),

  // VOC Status Change
  http.patch(`${API_BASE}/vocs/:id/status`, async ({ params, request }) => {
    await delay(300);
    const id = Number(params.id);
    const body = (await request.json()) as { status: VocStatus; processingNote?: string };
    const voc = mockVocs.find((v) => v.id === id);

    if (!voc) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VOC_NOT_FOUND', message: 'VOC를 찾을 수 없습니다' },
        },
        { status: 404 }
      );
    }

    voc.status = body.status;
    voc.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: voc });
  }),

  // VOC Assign
  http.patch(`${API_BASE}/vocs/:id/assign`, async ({ params, request }) => {
    await delay(300);
    const id = Number(params.id);
    const body = (await request.json()) as { assigneeId: number };
    const voc = mockVocs.find((v) => v.id === id);

    if (!voc) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VOC_NOT_FOUND', message: 'VOC를 찾을 수 없습니다' },
        },
        { status: 404 }
      );
    }

    // Find the user to assign
    const assignee = body.assigneeId === 1 ? { id: 1, name: '관리자', username: 'admin' } : null;
    voc.assignee = assignee ?? undefined;
    voc.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: voc });
  }),

  // VOC Add Memo
  http.post(`${API_BASE}/vocs/:id/memos`, async ({ params, request }) => {
    await delay(300);
    const id = Number(params.id);
    const body = (await request.json()) as { content: string; isInternal: boolean };
    const voc = mockVocs.find((v) => v.id === id);

    if (!voc) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VOC_NOT_FOUND', message: 'VOC를 찾을 수 없습니다' },
        },
        { status: 404 }
      );
    }

    const newMemo = {
      id: (voc.memos?.length ?? 0) + 1,
      content: body.content,
      isInternal: body.isInternal,
      author: { id: 1, name: '관리자', username: 'admin' },
      createdAt: new Date().toISOString(),
    };

    if (!voc.memos) {
      voc.memos = [];
    }
    voc.memos.push(newMemo);
    voc.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: voc });
  }),

  // VOC Public Status Lookup
  http.post(`${API_BASE}/vocs/public/status`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as { ticketId: string; customerEmail: string };
    const voc = mockVocs.find(
      (v) => v.ticketId === body.ticketId && v.customerEmail === body.customerEmail
    );

    if (!voc) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'VOC_NOT_FOUND', message: 'VOC를 찾을 수 없습니다' },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        ticketId: voc.ticketId,
        title: voc.title,
        status: voc.status,
        statusLabel: getStatusLabel(voc.status),
        createdAt: voc.createdAt,
        updatedAt: voc.updatedAt,
      },
    });
  }),

  // Email Templates
  http.get(`${API_BASE}/email/templates`, async () => {
    await delay(300);
    const templates: EmailTemplate[] = [
      {
        id: 1,
        name: 'VOC 접수 안내',
        type: 'VOC_RECEIVED',
        subject: '[VOC] 접수가 완료되었습니다 - {{ticketId}}',
        bodyHtml: '<p>안녕하세요, {{customerName}}님. 문의가 접수되었습니다.</p>',
        bodyText: '안녕하세요, {{customerName}}님. 문의가 접수되었습니다.',
        variables: ['ticketId', 'customerName', 'title'],
        isSystem: true,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];
    return HttpResponse.json({ success: true, data: templates });
  }),

  // Statistics / Dashboard
  http.get(`${API_BASE}/statistics/dashboard`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    // Generate trend data based on date range
    const generateTrendData = () => {
      const trends = [];
      const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const to = toDate ? new Date(toDate) : new Date();

      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        trends.push({
          date: d.toISOString().split('T')[0],
          received: Math.floor(Math.random() * 20) + 40,
          resolved: Math.floor(Math.random() * 18) + 35,
          pending: Math.floor(Math.random() * 8) + 5,
        });
      }
      return trends;
    };

    const dashboard: DashboardData = {
      kpi: {
        totalVocs: 1234,
        resolvedVocs: 678,
        pendingVocs: 234,
        avgResolutionTimeHours: 2.3,
        resolutionRate: 54.9,
        todayVocs: 58,
        weekVocs: 386,
        monthVocs: 1234,
        totalVocsChange: { value: 12, type: 'increase', count: 148 },
        avgResolutionTimeChange: { value: 5, type: 'decrease', count: -0.1 },
        resolutionRateChange: { value: 3, type: 'increase', count: 1.6 },
        pendingVocsChange: { value: 8, type: 'decrease', count: -20 },
      },
      trend: generateTrendData(),
      categoryStats: [
        { categoryId: 1, categoryName: '오류/버그', count: 456, percentage: 36.95 },
        { categoryId: 2, categoryName: '문의', count: 389, percentage: 31.52 },
        { categoryId: 3, categoryName: '개선', count: 234, percentage: 18.96 },
        { categoryId: 4, categoryName: '불만', count: 78, percentage: 6.32 },
        { categoryId: 5, categoryName: '칭찬', count: 45, percentage: 3.65 },
        { categoryId: 6, categoryName: '제안', count: 32, percentage: 2.59 },
        { categoryId: 7, categoryName: '장애', count: 28, percentage: 2.27 },
        { categoryId: 8, categoryName: '보안', count: 19, percentage: 1.54 },
        { categoryId: 9, categoryName: 'UI/UX', count: 15, percentage: 1.22 },
        { categoryId: 10, categoryName: '기타', count: 12, percentage: 0.97 },
      ],
      statusDistribution: [
        { status: 'RESOLVED', statusLabel: '완료', count: 678, percentage: 54.9 },
        { status: 'IN_PROGRESS', statusLabel: '처리중', count: 234, percentage: 18.96 },
        { status: 'IN_PROGRESS', statusLabel: '처리중', count: 156, percentage: 12.64 },
        { status: 'NEW', statusLabel: '신규', count: 89, percentage: 7.21 },
        { status: 'REJECTED', statusLabel: '반려', count: 45, percentage: 3.65 },
        { status: 'PENDING', statusLabel: '분석실패', count: 32, percentage: 2.59 },
      ],
      channelStats: [
        { channel: 'WEB', channelLabel: '웹', count: 658, percentage: 53.3 },
        { channel: 'PHONE', channelLabel: '전화', count: 411, percentage: 33.3 },
        { channel: 'EMAIL', channelLabel: '이메일', count: 165, percentage: 13.4 },
      ],
      priorityStats: [
        { priority: 'URGENT', priorityLabel: '긴급', count: 45, percentage: 3.65 },
        { priority: 'HIGH', priorityLabel: '높음', count: 289, percentage: 23.42 },
        { priority: 'NORMAL', priorityLabel: '보통', count: 567, percentage: 45.95 },
        { priority: 'LOW', priorityLabel: '낮음', count: 333, percentage: 26.98 },
      ],
      topAssignees: [
        {
          userId: 1,
          userName: '관리자',
          assignedCount: 50,
          resolvedCount: 45,
          avgResolutionTimeHours: 20.5,
        },
      ],
    };
    return HttpResponse.json({ success: true, data: dashboard });
  }),
];

function getStatusLabel(status: VocStatus): string {
  const labels: Record<VocStatus, string> = {
    NEW: '신규',
    IN_PROGRESS: '처리중',
    PENDING: '보류',
    RESOLVED: '해결완료',
    CLOSED: '종료',
    REJECTED: '반려',
  };
  return labels[status];
}

// Payment Error Handlers
import type { PaymentRequest, PaymentResponse } from '@/types';
import {
  mockPaymentErrorLogs,
  mockPaymentTransactions,
  getPaymentErrorLogs,
  getPaymentTransactions,
  getRandomPaymentError,
} from './data/paymentErrors';

// Append payment handlers to existing handlers array
handlers.push(
  // Get payment error logs
  http.get(`${API_BASE}/payments/errors`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const errorCode = url.searchParams.get('errorCode');
    const accountId = url.searchParams.get('accountId');
    const level = url.searchParams.get('level');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    const filteredLogs = getPaymentErrorLogs({
      errorCode: errorCode ?? undefined,
      accountId: accountId ?? undefined,
      level: level ?? undefined,
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined,
    });

    return HttpResponse.json({
      success: true,
      data: filteredLogs,
      totalCount: filteredLogs.length,
    });
  }),

  // Get payment error log by ID
  http.get(`${API_BASE}/payments/errors/:id`, async ({ params }) => {
    await delay(200);
    const { id } = params;
    const errorLog = mockPaymentErrorLogs.find((log) => log.id === id);

    if (!errorLog) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'ERROR_LOG_NOT_FOUND',
            message: '오류 로그를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: errorLog });
  }),

  // Get payment transactions
  http.get(`${API_BASE}/payments/transactions`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const accountId = url.searchParams.get('accountId');
    const errorCode = url.searchParams.get('errorCode');

    const filteredTransactions = getPaymentTransactions({
      status: status ?? undefined,
      accountId: accountId ?? undefined,
      errorCode: errorCode ?? undefined,
    });

    return HttpResponse.json({
      success: true,
      data: filteredTransactions,
      totalCount: filteredTransactions.length,
    });
  }),

  // Get payment transaction by ID
  http.get(`${API_BASE}/payments/transactions/:id`, async ({ params }) => {
    await delay(200);
    const { id } = params;
    const transaction = mockPaymentTransactions.find((txn) => txn.transactionId === id);

    if (!transaction) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: '거래 정보를 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: transaction });
  }),

  // Process payment (simulate various error scenarios)
  http.post(`${API_BASE}/payments/process`, async ({ request }) => {
    await delay(800);
    const body = (await request.json()) as PaymentRequest;

    // Simulate different error scenarios based on card number patterns
    const cardNumber = body.cardNumber.replace(/\s/g, '');
    const last4 = cardNumber.slice(-4);

    // Trigger specific error scenarios based on last 4 digits
    if (last4 === '0000') {
      // Timeout scenario
      await delay(30000); // This will trigger timeout in client
      const response: PaymentResponse = {
        success: false,
        errorCode: 'PAYMENT_TIMEOUT',
        errorMessage: '결제 처리 시간 초과',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 408 });
    }

    if (last4 === '1111') {
      // Insufficient balance
      const response: PaymentResponse = {
        success: false,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: '잔액 부족',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 400 });
    }

    if (last4 === '2222') {
      // Invalid card
      const response: PaymentResponse = {
        success: false,
        errorCode: 'INVALID_CARD',
        errorMessage: '유효하지 않은 카드 정보',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 400 });
    }

    if (last4 === '3333') {
      // Card expired
      const response: PaymentResponse = {
        success: false,
        errorCode: 'CARD_EXPIRED',
        errorMessage: '카드 유효기간 만료',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 400 });
    }

    if (last4 === '4444') {
      // Network error
      return HttpResponse.json(
        {
          success: false,
          errorCode: 'NETWORK_ERROR',
          errorMessage: '네트워크 연결 오류',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    if (last4 === '5555') {
      // Fraud detected
      const response: PaymentResponse = {
        success: false,
        errorCode: 'FRAUD_DETECTED',
        errorMessage: '이상 거래 감지',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 403 });
    }

    if (last4 === '6666') {
      // Daily limit exceeded
      const response: PaymentResponse = {
        success: false,
        errorCode: 'DAILY_LIMIT_EXCEEDED',
        errorMessage: '일일 한도 초과',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 400 });
    }

    if (last4 === '7777') {
      // System error
      const response: PaymentResponse = {
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: '내부 시스템 오류',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 500 });
    }

    if (last4 === '8888') {
      // Authentication failed
      const response: PaymentResponse = {
        success: false,
        errorCode: 'AUTHENTICATION_FAILED',
        errorMessage: '카드 인증 실패',
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 401 });
    }

    if (last4 === '9999') {
      // Random error for testing
      const randomError = getRandomPaymentError();
      const response: PaymentResponse = {
        success: false,
        errorCode: randomError.errorCode,
        errorMessage: randomError.message,
        timestamp: new Date().toISOString(),
      };
      return HttpResponse.json(response, { status: 400 });
    }

    // Success scenario - all other cards
    const transactionId = 'TXN-' + Date.now().toString();
    const response: PaymentResponse = {
      success: true,
      transactionId,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };
    return HttpResponse.json(response, { status: 200 });
  }),

  // Get payment error statistics
  http.get(`${API_BASE}/payments/statistics/errors`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');

    const logs = getPaymentErrorLogs({
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined,
    });

    // Calculate statistics
    const errorsByCode = logs.reduce(
      (acc, log) => {
        acc[log.errorCode] = (acc[log.errorCode] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsByLevel = logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalAmount = logs.reduce((sum, log) => sum + log.amount, 0);

    return HttpResponse.json({
      success: true,
      data: {
        totalErrors: logs.length,
        errorsByCode,
        errorsByLevel,
        totalFailedAmount: totalAmount,
        averageFailedAmount: logs.length > 0 ? totalAmount / logs.length : 0,
      },
    });
  })
);
