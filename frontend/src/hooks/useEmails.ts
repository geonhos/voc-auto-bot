'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { EmailTemplate } from '@/types';

const EMAIL_TEMPLATES_QUERY_KEY = 'emailTemplates';

/**
 * Backend API request DTO for sending emails.
 * Matches SendEmailRequest.java - supports both template-based and direct sending.
 */
export interface SendEmailApiRequest {
  templateId?: number;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, string>;
}

/**
 * Backend API response DTO for sent emails.
 * Matches SendEmailResponse.java.
 */
export interface SendEmailApiResponse {
  id: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  errorMessage: string | null;
}

/**
 * Fetch active email templates for the compose form.
 * Uses GET /api/v1/email-templates/active
 */
export function useEmailTemplates() {
  return useQuery({
    queryKey: [EMAIL_TEMPLATES_QUERY_KEY, 'active'],
    queryFn: async () => {
      const response = await api.get<EmailTemplate[]>('/email-templates/active');
      return response.data;
    },
  });
}

/**
 * Mutation for sending an email.
 * Uses POST /api/v1/emails
 */
export function useSendEmail() {
  return useMutation({
    mutationFn: async (data: SendEmailApiRequest) => {
      const response = await api.post<SendEmailApiResponse>('/emails', data);
      return response.data;
    },
  });
}
