export type EmailTemplateType =
  | 'VOC_RECEIVED'
  | 'VOC_IN_PROGRESS'
  | 'VOC_RESOLVED'
  | 'VOC_REJECTED'
  | 'CUSTOM';

export interface EmailTemplate {
  id: number;
  name: string;
  type: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  type: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  isActive?: boolean;
}

export interface SendEmailRequest {
  vocId: number;
  templateId: number;
  customSubject?: string;
  customBody?: string;
  additionalRecipients?: string[];
}

export interface EmailLog {
  id: number;
  vocId: number;
  templateId: number;
  recipientEmail: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}
