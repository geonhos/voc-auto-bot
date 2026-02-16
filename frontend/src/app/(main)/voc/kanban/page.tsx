'use client';

import Link from 'next/link';
import { useState } from 'react';

import { VocPriorityBadge } from '@/components/voc/VocPriorityBadge';
import { useVocs, useChangeVocStatus } from '@/hooks/useVocs';
import { isConflictError } from '@/lib/api/client';
import { VocStatus, isTerminalStatus } from '@/types';

const STATUS_COLUMNS: { status: VocStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'NEW', label: '접수', color: 'bg-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/50' },
  { status: 'IN_PROGRESS', label: '처리중', color: 'bg-warning', bgColor: 'bg-warning/5 dark:bg-warning/10' },
  { status: 'PENDING', label: '보류', color: 'bg-danger', bgColor: 'bg-danger/5 dark:bg-danger/10' },
  { status: 'RESOLVED', label: '완료', color: 'bg-success', bgColor: 'bg-success/5 dark:bg-success/10' },
  { status: 'REJECTED', label: '반려', color: 'bg-danger', bgColor: 'bg-danger/5 dark:bg-danger/10' },
  { status: 'CLOSED', label: '종료', color: 'bg-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-900/50' },
];

export default function VocKanbanPage() {
  const { data, isLoading } = useVocs({ page: 0, size: 100 });
  const changeStatusMutation = useChangeVocStatus();
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<VocStatus | null>(null);

  const vocs = data?.content ?? [];

  const getVocsByStatus = (status: VocStatus) => {
    return vocs.filter((voc) => voc.status === status);
  };

  const handleDragStart = (e: React.DragEvent, vocId: number) => {
    setDraggedId(vocId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(vocId));
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: VocStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: VocStatus) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (!draggedId) return;

    const draggedVoc = vocs.find((voc) => voc.id === draggedId);
    if (!draggedVoc || draggedVoc.status === newStatus) {
      setDraggedId(null);
      return;
    }

    try {
      await changeStatusMutation.mutateAsync({
        vocId: draggedId,
        data: { status: newStatus },
      });
    } catch (error) {
      console.error('상태 변경 실패:', error);
      if (isConflictError(error)) {
        alert('다른 사용자가 이미 변경했습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    }

    setDraggedId(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">VOC 칸반 보드</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">드래그 앤 드롭으로 VOC 상태를 변경하세요.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">VOC 칸반보드</h1>
          <p className="text-slate-500 dark:text-slate-400">VOC를 드래그앤드롭으로 관리하세요.</p>
          <div className="mt-3 p-3 bg-info/10 dark:bg-info/5 border border-info/20 rounded-lg text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-info">상태 변경 규칙:</span>{' '}
            접수 → 처리중/완료/반려 | 처리중 → 완료/반려 | <span className="text-slate-400">완료/반려는 변경 불가</span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6">
          {STATUS_COLUMNS.map((column) => {
            const columnVocs = getVocsByStatus(column.status);
            const isDropTarget = dragOverStatus === column.status;
            return (
              <div
                key={column.status}
                className="flex-shrink-0 w-80"
              >
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
                  {/* Column Header */}
                  <div className={`px-4 py-3 border-b border-border-light dark:border-border-dark ${
                    column.status === 'NEW' ? 'bg-slate-100 dark:bg-slate-800' :
                    column.status === 'IN_PROGRESS' ? 'bg-warning/10 dark:bg-warning/20' :
                    column.status === 'PENDING' ? 'bg-danger/10 dark:bg-danger/20' :
                    column.status === 'RESOLVED' ? 'bg-success/10 dark:bg-success/20' :
                    column.status === 'REJECTED' ? 'bg-danger/10 dark:bg-danger/20' :
                    'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {column.label}
                        </h3>
                      </div>
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        {columnVocs.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div
                    className={`p-3 space-y-3 min-h-[400px] transition-colors ${column.bgColor} ${
                      isDropTarget ? 'ring-2 ring-primary ring-inset' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, column.status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.status)}
                  >
                    {columnVocs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                        {isDropTarget ? '여기에 놓으세요' : 'VOC가 없습니다'}
                      </div>
                    ) : (
                      columnVocs.map((voc) => (
                        <div
                          key={voc.id}
                          className={`p-4 bg-white dark:bg-slate-800 rounded-lg border-l-4 ${
                            column.status === 'NEW' ? 'border-slate-400' :
                            column.status === 'IN_PROGRESS' ? 'border-warning' :
                            column.status === 'PENDING' ? 'border-danger' :
                            column.status === 'RESOLVED' ? 'border-success' :
                            column.status === 'REJECTED' ? 'border-danger' :
                            'border-slate-500'
                          } shadow-sm hover:shadow-md transition-all ${
                            isTerminalStatus(voc.status) ? 'cursor-not-allowed opacity-70' : 'cursor-grab active:cursor-grabbing'
                          } ${
                            draggedId === voc.id ? 'opacity-50 scale-95' : ''
                          }`}
                          draggable={!isTerminalStatus(voc.status)}
                          onDragStart={(e) => !isTerminalStatus(voc.status) && handleDragStart(e, voc.id)}
                          onDragEnd={handleDragEnd}
                        >
                          <Link href={`/voc/${voc.id}`} className="block">
                            <div className="mb-3">
                              <p className="font-semibold text-sm text-primary mb-1">
                                {voc.ticketId}
                              </p>
                              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                                {voc.title}
                              </h4>
                            </div>

                            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="material-icons-outlined text-sm">person</span>
                                <span>{voc.customerName}</span>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <VocPriorityBadge priority={voc.priority} />
                            </div>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
