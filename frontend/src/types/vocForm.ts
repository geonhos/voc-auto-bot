import { z } from 'zod';

import type { VocPriority } from './voc';

/**
 * VOC 입력 폼 데이터 타입
 */
export interface VocFormData {
  title: string;
  content: string;
  categoryId: number | null;
  priority: VocPriority;
  customerName?: string;
  customerEmail: string;
  files?: File[];
}

/**
 * VOC 상수 - 백엔드 VocConstants와 동기화 필요
 */
export const VOC_CONSTANTS = {
  TITLE_MIN_LENGTH: 2,
  TITLE_MAX_LENGTH: 200,
  CONTENT_MIN_LENGTH: 10,
  CONTENT_MAX_LENGTH: 10000,
  CUSTOMER_NAME_MAX_LENGTH: 100,
  CUSTOMER_EMAIL_MAX_LENGTH: 100,
  FILE_SIZE_LIMIT_MB: 10,
  MAX_FILES_PER_VOC: 5,
} as const;

/**
 * VOC 입력 폼 검증 스키마
 */
export const vocFormSchema = z.object({
  title: z
    .string()
    .min(VOC_CONSTANTS.TITLE_MIN_LENGTH, `제목은 ${VOC_CONSTANTS.TITLE_MIN_LENGTH}자 이상이어야 합니다`)
    .max(VOC_CONSTANTS.TITLE_MAX_LENGTH, `제목은 ${VOC_CONSTANTS.TITLE_MAX_LENGTH}자 이하여야 합니다`),
  content: z
    .string()
    .min(VOC_CONSTANTS.CONTENT_MIN_LENGTH, `내용은 ${VOC_CONSTANTS.CONTENT_MIN_LENGTH}자 이상이어야 합니다`)
    .max(VOC_CONSTANTS.CONTENT_MAX_LENGTH, `내용은 ${VOC_CONSTANTS.CONTENT_MAX_LENGTH}자 이하여야 합니다`),
  // categoryId is optional - can be null or undefined during initial submission
  // Category assignment may happen later during VOC processing
  categoryId: z.number().nullable().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
    required_error: '우선순위를 선택해주세요',
  }),
  customerName: z
    .string()
    .max(VOC_CONSTANTS.CUSTOMER_NAME_MAX_LENGTH, `고객명은 ${VOC_CONSTANTS.CUSTOMER_NAME_MAX_LENGTH}자 이하여야 합니다`)
    .optional()
    .or(z.literal('')),
  customerEmail: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다')
    .max(VOC_CONSTANTS.CUSTOMER_EMAIL_MAX_LENGTH, `이메일은 ${VOC_CONSTANTS.CUSTOMER_EMAIL_MAX_LENGTH}자 이하여야 합니다`),
});

export type VocFormSchemaType = z.infer<typeof vocFormSchema>;

/**
 * 우선순위 레이블 매핑
 */
export const priorityLabels: Record<VocPriority, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

/**
 * 우선순위 색상 매핑 (Tailwind classes)
 */
export const priorityColors: Record<VocPriority, string> = {
  LOW: 'text-[#7C8590] bg-[#7C8590]/10',
  NORMAL: 'text-[#5878A0] bg-[#5878A0]/10',
  HIGH: 'text-[#B89350] bg-[#B89350]/10',
  URGENT: 'text-[#B85C5C] bg-[#B85C5C]/10',
};

/**
 * 카테고리 code → 기본 추천 우선순위 매핑
 */
export const CATEGORY_PRIORITY_MAP: Record<string, VocPriority> = {
  ERROR: 'HIGH',
  FEATURE: 'NORMAL',
  INQUIRY: 'LOW',
  COMPLAINT: 'HIGH',
  PRAISE: 'LOW',
};

/**
 * ERROR 카테고리에서 URGENT로 에스컬레이션하는 키워드
 */
export const URGENT_KEYWORDS: string[] = [
  '결제',
  '장애',
  '접속불가',
  '데이터 손실',
  '보안',
  '해킹',
  '개인정보',
  '서비스 중단',
];

/**
 * 대분류 카드 메타 정보
 */
export interface CategoryCardMeta {
  code: string;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
}

/**
 * 5대분류 카드별 메타 정보
 */
export const CATEGORY_CARD_META: CategoryCardMeta[] = [
  {
    code: 'ERROR',
    label: '오류/버그',
    description: '시스템 오류 및 버그 리포트',
    icon: 'Bug',
    colorClass: 'border-red-500 bg-red-50 text-red-700',
  },
  {
    code: 'FEATURE',
    label: '기능 요청',
    description: '새로운 기능 및 개선 요청',
    icon: 'Lightbulb',
    colorClass: 'border-blue-500 bg-blue-50 text-blue-700',
  },
  {
    code: 'INQUIRY',
    label: '문의',
    description: '사용법, 정책 등 일반 문의',
    icon: 'HelpCircle',
    colorClass: 'border-green-500 bg-green-50 text-green-700',
  },
  {
    code: 'COMPLAINT',
    label: '불만/컴플레인',
    description: '서비스 불만 및 민원',
    icon: 'AlertTriangle',
    colorClass: 'border-amber-500 bg-amber-50 text-amber-700',
  },
  {
    code: 'PRAISE',
    label: '칭찬/감사',
    description: '서비스 만족 및 감사 피드백',
    icon: 'ThumbsUp',
    colorClass: 'border-purple-500 bg-purple-50 text-purple-700',
  },
];
