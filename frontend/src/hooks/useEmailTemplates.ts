'use client';

import { useQuery } from '@tanstack/react-query';
import { emailApi } from '@/lib/api/emailApi';
import type { EmailTemplate } from '@/types';

/**
 * @description Hook for fetching email templates
 */
export function useEmailTemplates(activeOnly = false) {
  return useQuery<EmailTemplate[], Error>({
    queryKey: ['emailTemplates', activeOnly],
    queryFn: () => (activeOnly ? emailApi.getActiveTemplates() : emailApi.getTemplates()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * @description Hook for fetching a single email template by ID
 */
export function useEmailTemplate(id: number) {
  return useQuery<EmailTemplate, Error>({
    queryKey: ['emailTemplate', id],
    queryFn: () => emailApi.getTemplate(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
