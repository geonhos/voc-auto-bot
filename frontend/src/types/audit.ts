export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT';
export type AuditEntityType = 'VOC' | 'CATEGORY' | 'USER' | 'EMAIL_TEMPLATE';

export interface AuditLog {
  id: number;
  userId: number | null;
  username: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  beforeData: string | null;
  afterData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
