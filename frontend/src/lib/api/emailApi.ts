import { api } from './client';
import type {
  EmailTemplate,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  SendEmailRequest,
  EmailLog,
} from '@/types';

/**
 * @description Email template and email sending API functions
 */
export const emailApi = {
  /**
   * Get all email templates
   */
  getTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await api.get<EmailTemplate[]>('/emails/templates');
    return response.data;
  },

  /**
   * Get active email templates only
   */
  getActiveTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await api.get<EmailTemplate[]>('/emails/templates', {
      isActive: true,
    });
    return response.data;
  },

  /**
   * Get email template by ID
   */
  getTemplate: async (id: number): Promise<EmailTemplate> => {
    const response = await api.get<EmailTemplate>(`/emails/templates/${id}`);
    return response.data;
  },

  /**
   * Create new email template
   */
  createTemplate: async (data: CreateEmailTemplateRequest): Promise<EmailTemplate> => {
    const response = await api.post<EmailTemplate>('/emails/templates', data);
    return response.data;
  },

  /**
   * Update email template
   */
  updateTemplate: async (id: number, data: UpdateEmailTemplateRequest): Promise<EmailTemplate> => {
    const response = await api.put<EmailTemplate>(`/emails/templates/${id}`, data);
    return response.data;
  },

  /**
   * Delete email template
   */
  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/emails/templates/${id}`);
  },

  /**
   * Send email
   */
  sendEmail: async (data: SendEmailRequest): Promise<EmailLog> => {
    const response = await api.post<EmailLog>('/emails/send', data);
    return response.data;
  },

  /**
   * Get email logs for a VOC
   */
  getEmailLogs: async (vocId: number): Promise<EmailLog[]> => {
    const response = await api.get<EmailLog[]>(`/emails/logs/voc/${vocId}`);
    return response.data;
  },

  /**
   * Resend failed email
   */
  resendEmail: async (logId: number): Promise<EmailLog> => {
    const response = await api.post<EmailLog>(`/emails/logs/${logId}/resend`);
    return response.data;
  },
};
