import type { Voc, Category, VocStatus, VocPriority, SimilarVoc } from '@/types';

/**
 * @description Test fixture data for VOC E2E tests
 */

export const testCategories: Category[] = [
  { id: 1, name: '제품 문의', code: 'PRODUCT', level: 1, sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 2, name: '서비스 문의', code: 'SERVICE', level: 1, sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 3, name: '불만사항', code: 'COMPLAINT', level: 1, sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 4, name: '제안사항', code: 'SUGGESTION', level: 1, sortOrder: 4, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 5, name: '기타', code: 'OTHER', level: 1, sortOrder: 5, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const testAssignees = [
  { id: 1, name: '김철수', username: 'kim.cs' },
  { id: 2, name: '이영희', username: 'lee.yh' },
  { id: 3, name: '박민수', username: 'park.ms' },
];

export const createVocFormData = {
  valid: {
    title: '제품 배송이 지연되고 있습니다',
    content: '주문한 제품이 예정일보다 3일이나 지연되고 있습니다. 빠른 확인 부탁드립니다.',
    priority: 'HIGH' as VocPriority,
    categoryId: 1,
    customerName: '홍길동',
    customerPhone: '010-1234-5678',
  },
  minimal: {
    title: '최소 정보만 입력',
    content: '최소한의 정보로 VOC를 등록합니다.',
    priority: 'MEDIUM' as VocPriority,
  },
  invalid: {
    tooShortTitle: 'A',
    tooLongTitle: 'A'.repeat(201),
    tooShortContent: '짧음',
    emptyTitle: '',
    emptyContent: '',
  },
};

export const testVocs: Voc[] = [
  {
    id: 1,
    ticketId: 'VOC-20260125-0001',
    title: '제품 배송 지연',
    content: '제품이 예정일보다 지연되고 있습니다.',
    status: 'RECEIVED' as VocStatus,
    priority: 'HIGH' as VocPriority,
    channel: 'WEB',
    customerName: '홍길동',
    customerEmail: 'hong@example.com',
    customerPhone: '010-1234-5678',
    category: testCategories[0],
    attachments: [],
    memos: [],
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 2,
    ticketId: 'VOC-20260125-0002',
    title: '서비스 문의 사항',
    content: '서비스 이용 방법에 대해 궁금합니다.',
    status: 'ASSIGNED' as VocStatus,
    priority: 'MEDIUM' as VocPriority,
    channel: 'EMAIL',
    customerName: '김영희',
    customerEmail: 'kim@example.com',
    category: testCategories[1],
    assignee: testAssignees[0],
    attachments: [],
    memos: [
      {
        id: 1,
        content: '담당자가 확인 중입니다.',
        isInternal: false,
        author: testAssignees[0],
        createdAt: '2026-01-25T11:00:00Z',
      },
    ],
    createdAt: '2026-01-25T09:00:00Z',
    updatedAt: '2026-01-25T11:00:00Z',
  },
  {
    id: 3,
    ticketId: 'VOC-20260125-0003',
    title: '불만사항 접수',
    content: '직원의 불친절한 응대에 대한 불만입니다.',
    status: 'IN_PROGRESS' as VocStatus,
    priority: 'URGENT' as VocPriority,
    channel: 'PHONE',
    customerName: '박철수',
    customerEmail: 'park@example.com',
    customerPhone: '010-9876-5432',
    category: testCategories[2],
    assignee: testAssignees[1],
    attachments: [],
    memos: [],
    createdAt: '2026-01-25T08:00:00Z',
    updatedAt: '2026-01-25T12:00:00Z',
  },
  {
    id: 4,
    ticketId: 'VOC-20260124-0015',
    title: '제안사항입니다',
    content: '새로운 기능 추가를 제안합니다.',
    status: 'RESOLVED' as VocStatus,
    priority: 'LOW' as VocPriority,
    channel: 'WEB',
    customerName: '이민수',
    customerEmail: 'lee@example.com',
    category: testCategories[3],
    assignee: testAssignees[2],
    resolvedAt: '2026-01-24T18:00:00Z',
    attachments: [],
    memos: [],
    createdAt: '2026-01-24T14:00:00Z',
    updatedAt: '2026-01-24T18:00:00Z',
  },
  {
    id: 5,
    ticketId: 'VOC-20260124-0010',
    title: '기타 문의',
    content: '기타 문의 사항입니다.',
    status: 'CLOSED' as VocStatus,
    priority: 'MEDIUM' as VocPriority,
    channel: 'CHAT',
    customerName: '최영수',
    customerEmail: 'choi@example.com',
    category: testCategories[4],
    assignee: testAssignees[0],
    resolvedAt: '2026-01-24T16:00:00Z',
    closedAt: '2026-01-24T17:00:00Z',
    attachments: [],
    memos: [],
    createdAt: '2026-01-24T10:00:00Z',
    updatedAt: '2026-01-24T17:00:00Z',
  },
];

export const testSimilarVocs: SimilarVoc[] = [
  {
    id: 2,
    ticketId: 'VOC-20260124-0020',
    title: '제품 배송 관련 문의',
    status: 'RESOLVED' as VocStatus,
    similarity: 0.87,
    createdAt: '2026-01-24T15:00:00Z',
  },
  {
    id: 3,
    ticketId: 'VOC-20260123-0045',
    title: '배송 지연 문의',
    status: 'CLOSED' as VocStatus,
    similarity: 0.76,
    createdAt: '2026-01-23T09:30:00Z',
  },
  {
    id: 4,
    ticketId: 'VOC-20260122-0012',
    title: '배송 상태 확인 요청',
    status: 'RESOLVED' as VocStatus,
    similarity: 0.65,
    createdAt: '2026-01-22T11:20:00Z',
  },
];

export const statusLookupData = {
  valid: {
    ticketId: 'VOC-20260125-0001',
    customerEmail: 'hong@example.com',
  },
  invalidTicketId: {
    ticketId: 'INVALID-ID',
    customerEmail: 'hong@example.com',
  },
  invalidEmail: {
    ticketId: 'VOC-20260125-0001',
    customerEmail: 'wrong@example.com',
  },
};

export const testFiles = {
  validImage: {
    name: 'test-image.png',
    type: 'image/png',
    size: 1024 * 500, // 500KB
  },
  validPdf: {
    name: 'test-document.pdf',
    type: 'application/pdf',
    size: 1024 * 1024 * 2, // 2MB
  },
  oversized: {
    name: 'large-file.zip',
    type: 'application/zip',
    size: 1024 * 1024 * 11, // 11MB (over limit)
  },
  invalidType: {
    name: 'script.exe',
    type: 'application/x-msdownload',
    size: 1024 * 100,
  },
};

export const kanbanColumns = [
  { id: 'RECEIVED', title: '접수됨', statuses: ['RECEIVED'] },
  { id: 'ASSIGNED', title: '배정됨', statuses: ['ASSIGNED'] },
  { id: 'IN_PROGRESS', title: '처리중', statuses: ['IN_PROGRESS', 'PENDING'] },
  { id: 'RESOLVED', title: '해결됨', statuses: ['RESOLVED'] },
  { id: 'CLOSED', title: '완료됨', statuses: ['CLOSED', 'REJECTED'] },
];

export const pageResponseMock = {
  content: testVocs,
  page: 0,
  size: 10,
  totalElements: testVocs.length,
  totalPages: 1,
  first: true,
  last: true,
  empty: false,
};
