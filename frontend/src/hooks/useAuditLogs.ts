'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import type { AuditLog, AuditLogFilter } from '@/types';

const AUDIT_LOGS_QUERY_KEY = 'audit-logs';

export function useAuditLogs(params?: AuditLogFilter) {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, params],
    queryFn: async () => {
      const cleanParams = params
        ? Object.fromEntries(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
          )
        : undefined;
      const response = await api.get<AuditLog[]>('/admin/audit-logs', cleanParams as Record<string, unknown>);
      return response;
    },
  });
}
