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
 * VOC 입력 폼 검증 스키마
 */
export const vocFormSchema = z.object({
  title: z
    .string()
    .min(2, '제목은 2자 이상이어야 합니다')
    .max(200, '제목은 200자 이하여야 합니다'),
  content: z
    .string()
    .min(10, '내용은 10자 이상이어야 합니다')
    .max(5000, '내용은 5000자 이하여야 합니다'),
  categoryId: z.number({
    required_error: '카테고리를 선택해주세요',
    invalid_type_error: '카테고리를 선택해주세요',
  }).nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    required_error: '우선순위를 선택해주세요',
  }),
  customerName: z
    .string()
    .max(100, '고객명은 100자 이하여야 합니다')
    .optional()
    .or(z.literal('')),
  customerEmail: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다')
    .max(100, '이메일은 100자 이하여야 합니다'),
});

export type VocFormSchemaType = z.infer<typeof vocFormSchema>;

/**
 * 우선순위 레이블 매핑
 */
export const priorityLabels: Record<VocPriority, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  URGENT: '긴급',
};

/**
 * 우선순위 색상 매핑 (Tailwind classes)
 */
export const priorityColors: Record<VocPriority, string> = {
  LOW: 'text-gray-600 bg-gray-100',
  MEDIUM: 'text-blue-600 bg-blue-100',
  HIGH: 'text-orange-600 bg-orange-100',
  URGENT: 'text-red-600 bg-red-100',
};
