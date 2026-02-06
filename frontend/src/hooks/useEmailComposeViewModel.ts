'use client';

import { useState, useCallback, useEffect } from 'react';

import type { Voc, EmailTemplate } from '@/types';

import { useEmailTemplates, useSendEmail } from './useEmails';
import type { SendEmailApiRequest, SendEmailApiResponse } from './useEmails';
import { useVoc } from './useVocs';

export interface EmailComposeFormState {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  templateId: number | null;
}

interface UseEmailComposeViewModelProps {
  vocId?: number;
  onSuccess?: (response: SendEmailApiResponse) => void;
  onError?: (error: Error) => void;
}

interface UseEmailComposeViewModelReturn {
  /** Current form state */
  form: EmailComposeFormState;
  /** The associated VOC data (if vocId was provided) */
  voc: Voc | undefined;
  /** Whether the VOC is loading */
  isVocLoading: boolean;
  /** Available email templates */
  templates: EmailTemplate[];
  /** Whether templates are loading */
  isTemplatesLoading: boolean;
  /** Whether the email is being sent */
  isSending: boolean;
  /** Error from the send mutation */
  sendError: Error | null;
  /** Update a single form field */
  updateField: <K extends keyof EmailComposeFormState>(field: K, value: EmailComposeFormState[K]) => void;
  /** Select a template and auto-fill subject/body with variable substitution */
  selectTemplate: (templateId: number | null) => void;
  /** Submit the email */
  handleSend: () => Promise<void>;
  /** Reset form to initial state */
  resetForm: () => void;
}

const INITIAL_FORM_STATE: EmailComposeFormState = {
  recipientEmail: '',
  recipientName: '',
  subject: '',
  body: '',
  templateId: null,
};

/**
 * Replaces template variables like {{customerName}}, {{ticketId}}, etc.
 * with actual VOC data.
 */
function replaceTemplateVariables(text: string, voc: Voc | undefined): string {
  if (!voc) return text;

  const variables: Record<string, string> = {
    customerName: voc.customerName || '',
    customerEmail: voc.customerEmail || '',
    ticketId: voc.ticketId || '',
    title: voc.title || '',
    category: voc.category?.name || '',
    status: voc.status || '',
    content: voc.content || '',
    createdAt: voc.createdAt || '',
  };

  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Build the variables map from VOC data for template-based sending.
 */
function buildVariablesMap(voc: Voc | undefined): Record<string, string> {
  if (!voc) return {};

  return {
    customerName: voc.customerName || '',
    customerEmail: voc.customerEmail || '',
    ticketId: voc.ticketId || '',
    title: voc.title || '',
    category: voc.category?.name || '',
    status: voc.status || '',
    content: voc.content || '',
    createdAt: voc.createdAt || '',
  };
}

export function useEmailComposeViewModel({
  vocId,
  onSuccess,
  onError,
}: UseEmailComposeViewModelProps): UseEmailComposeViewModelReturn {
  const [form, setForm] = useState<EmailComposeFormState>(INITIAL_FORM_STATE);
  const [sendError, setSendError] = useState<Error | null>(null);

  // Fetch associated VOC
  const { data: voc, isLoading: isVocLoading } = useVoc(vocId ?? 0);

  // Fetch available templates
  const { data: templates, isLoading: isTemplatesLoading } = useEmailTemplates();

  // Send email mutation
  const sendMutation = useSendEmail();

  // Auto-fill recipient from VOC data when VOC loads
  useEffect(() => {
    if (voc) {
      setForm((prev) => ({
        ...prev,
        recipientEmail: prev.recipientEmail || voc.customerEmail || '',
        recipientName: prev.recipientName || voc.customerName || '',
      }));
    }
  }, [voc]);

  const updateField = useCallback(
    <K extends keyof EmailComposeFormState>(field: K, value: EmailComposeFormState[K]) => {
      setForm((prev) => {
        const newState = { ...prev, [field]: value };
        // 템플릿 선택 상태에서 제목/본문을 직접 수정하면 템플릿 연결 해제
        if (prev.templateId && (field === 'subject' || field === 'body')) {
          newState.templateId = null;
        }
        return newState;
      });
    },
    []
  );

  const selectTemplate = useCallback(
    (templateId: number | null) => {
      setForm((prev) => {
        if (!templateId) {
          return { ...prev, templateId: null, subject: '', body: '' };
        }

        const template = templates?.find((t) => t.id === templateId);
        if (!template) {
          return { ...prev, templateId };
        }

        return {
          ...prev,
          templateId,
          subject: replaceTemplateVariables(template.subject, voc),
          body: replaceTemplateVariables(template.bodyHtml || template.bodyText || '', voc),
        };
      });
    },
    [templates, voc]
  );

  const handleSend = useCallback(async () => {
    setSendError(null);

    if (!form.recipientEmail) {
      const err = new Error('수신자 이메일은 필수입니다.');
      setSendError(err);
      onError?.(err);
      return;
    }

    if (!form.templateId && !form.subject) {
      const err = new Error('템플릿을 선택하거나 제목을 입력해주세요.');
      setSendError(err);
      onError?.(err);
      return;
    }

    const request: SendEmailApiRequest = form.templateId
      ? {
          templateId: form.templateId,
          recipientEmail: form.recipientEmail,
          recipientName: form.recipientName || undefined,
          variables: buildVariablesMap(voc),
        }
      : {
          recipientEmail: form.recipientEmail,
          recipientName: form.recipientName || undefined,
          subject: form.subject,
          body: form.body,
        };

    try {
      const result = await sendMutation.mutateAsync(request);
      onSuccess?.(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('이메일 발송에 실패했습니다.');
      setSendError(err);
      onError?.(err);
    }
  }, [form, voc, sendMutation, onSuccess, onError]);

  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM_STATE,
      recipientEmail: voc?.customerEmail || '',
      recipientName: voc?.customerName || '',
    });
    setSendError(null);
  }, [voc]);

  return {
    form,
    voc,
    isVocLoading,
    templates: templates ?? [],
    isTemplatesLoading,
    isSending: sendMutation.isPending,
    sendError,
    updateField,
    selectTemplate,
    handleSend,
    resetForm,
  };
}
