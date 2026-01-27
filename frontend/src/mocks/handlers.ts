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
    status: 'RECEIVED',
    priority: 'MEDIUM',
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
      status: 'RECEIVED',
      attachments: [],
      memos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockVocs.push(newVoc);
    return HttpResponse.json({ success: true, data: newVoc }, { status: 201 });
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
        { status: 'ASSIGNED', statusLabel: '분석중', count: 156, percentage: 12.64 },
        { status: 'RECEIVED', statusLabel: '접수', count: 89, percentage: 7.21 },
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
        { priority: 'MEDIUM', priorityLabel: '보통', count: 567, percentage: 45.95 },
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
    RECEIVED: '접수됨',
    ASSIGNED: '담당자 배정',
    IN_PROGRESS: '처리중',
    PENDING: '보류',
    RESOLVED: '처리완료',
    CLOSED: '종료',
    REJECTED: '반려',
  };
  return labels[status];
}
