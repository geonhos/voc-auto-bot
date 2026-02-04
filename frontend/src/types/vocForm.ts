import { z } from 'zod';

import type { VocPriority, VocChannel } from './voc';

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
  LOW: 'text-gray-600 bg-gray-100',
  NORMAL: 'text-blue-600 bg-blue-100',
  HIGH: 'text-orange-600 bg-orange-100',
  URGENT: 'text-red-600 bg-red-100',
};
