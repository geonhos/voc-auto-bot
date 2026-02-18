'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuthStore } from '@/store/authStore';
import type { AuditAction, AuditEntityType, AuditLog } from '@/types';

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  STATUS_CHANGE: '상태 변경',
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
};

const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  VOC: 'VOC',
  CATEGORY: '카테고리',
  USER: '사용자',
  EMAIL_TEMPLATE: '이메일 템플릿',
};

export default function AuditLogsPage() {
  const router = useRouter();
  const { hasRole, isAuthenticated } = useAuthStore();

  const [actionFilter, setActionFilter] = useState<AuditAction | ''>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !hasRole('ADMIN')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, hasRole, router]);

  const { data, isLoading, refetch } = useAuditLogs({
    action: actionFilter || undefined,
    entityType: entityTypeFilter || undefined,
    startDate: startDate ? `${startDate}T00:00:00` : undefined,
    endDate: endDate ? `${endDate}T23:59:59` : undefined,
    page,
    size: 20,
  });

  const auditLogs = data?.data || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  if (!isAuthenticated || !hasRole('ADMIN')) {
    return null;
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatJson = (jsonStr: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">감사 로그</h1>
        <p className="mt-1 text-sm text-gray-500">시스템 변경 이력을 조회합니다.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-40">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as AuditAction | '');
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">전체 액션</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value as AuditEntityType | '');
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">전체 엔티티</option>
              {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="시작일"
            />
          </div>
          <div className="w-44">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="종료일"
            />
          </div>
          <button
            onClick={() => {
              setActionFilter('');
              setEntityTypeFilter('');
              setStartDate('');
              setEndDate('');
              setPage(0);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            초기화
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">시간</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">사용자</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">액션</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">엔티티</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">엔티티 ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{log.username || '-'}</td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      {log.entityId || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              {totalElements}건 중 {page * 20 + 1}-
              {Math.min((page + 1) * 20, totalElements)}건
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                이전
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">감사 로그 상세</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">시간</span>
                  <p className="font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">사용자</span>
                  <p className="font-medium">{selectedLog.username || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">액션</span>
                  <p>
                    <ActionBadge action={selectedLog.action} />
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">엔티티</span>
                  <p className="font-medium">
                    {ENTITY_TYPE_LABELS[selectedLog.entityType]} ({selectedLog.entityId || '-'})
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">IP</span>
                  <p className="font-mono text-xs">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">User Agent</span>
                  <p className="font-mono text-xs truncate" title={selectedLog.userAgent || ''}>
                    {selectedLog.userAgent || '-'}
                  </p>
                </div>
              </div>

              {/* Before / After Data */}
              {(selectedLog.beforeData || selectedLog.afterData) && (
                <div className="space-y-3">
                  {selectedLog.beforeData && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">변경 전</h3>
                      <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-x-auto max-h-48">
                        {formatJson(selectedLog.beforeData)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.afterData && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">변경 후</h3>
                      <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-x-auto max-h-48">
                        {formatJson(selectedLog.afterData)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: AuditAction }) {
  const colors: Record<AuditAction, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    STATUS_CHANGE: 'bg-yellow-100 text-yellow-700',
    LOGIN: 'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[action]}`}>
      {ACTION_LABELS[action]}
    </span>
  );
}
