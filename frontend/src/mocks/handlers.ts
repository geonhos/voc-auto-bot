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

    if (body.username === 'admin' && body.password === 'admin123') {
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
      data: filteredVocs,
      page: 1,
      size: 20,
      totalElements: filteredVocs.length,
      totalPages: 1,
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
  http.get(`${API_BASE}/statistics/dashboard`, async () => {
    await delay(500);
    const dashboard: DashboardData = {
      kpi: {
        totalVocs: 150,
        resolvedVocs: 120,
        pendingVocs: 30,
        avgResolutionTimeHours: 24.5,
        resolutionRate: 80.0,
        todayVocs: 5,
        weekVocs: 25,
        monthVocs: 80,
      },
      trend: [
        { date: '2024-01-10', received: 10, resolved: 8, pending: 2 },
        { date: '2024-01-11', received: 12, resolved: 10, pending: 4 },
        { date: '2024-01-12', received: 8, resolved: 9, pending: 3 },
        { date: '2024-01-13', received: 15, resolved: 12, pending: 6 },
        { date: '2024-01-14', received: 11, resolved: 14, pending: 3 },
      ],
      categoryStats: [
        { categoryId: 1, categoryName: '제품 문의', count: 50, percentage: 33.3 },
        { categoryId: 4, categoryName: '불만/개선', count: 40, percentage: 26.7 },
      ],
      statusDistribution: [
        { status: 'RECEIVED', statusLabel: '접수됨', count: 20, percentage: 13.3 },
        { status: 'IN_PROGRESS', statusLabel: '처리중', count: 30, percentage: 20.0 },
        { status: 'RESOLVED', statusLabel: '처리완료', count: 100, percentage: 66.7 },
      ],
      channelStats: [
        { channel: 'WEB', channelLabel: '웹', count: 80, percentage: 53.3 },
        { channel: 'PHONE', channelLabel: '전화', count: 50, percentage: 33.3 },
        { channel: 'EMAIL', channelLabel: '이메일', count: 20, percentage: 13.4 },
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
