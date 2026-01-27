'use client';

import { useState } from 'react';
import { useVocs, useChangeVocStatus } from '@/hooks/useVocs';
import { VocStatus } from '@/types';
import Link from 'next/link';

const STATUS_COLUMNS: { status: VocStatus; label: string; color: string }[] = [
  { status: 'RECEIVED', label: '접수', color: 'bg-blue-500' },
  { status: 'ASSIGNED', label: '배정', color: 'bg-purple-500' },
  { status: 'IN_PROGRESS', label: '처리중', color: 'bg-yellow-500' },
  { status: 'PENDING', label: '보류', color: 'bg-red-500' },
  { status: 'RESOLVED', label: '완료', color: 'bg-green-500' },
];

export default function VocKanbanPage() {
  const { data, isLoading } = useVocs({ page: 1, size: 100 });
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
      alert('상태 변경에 실패했습니다.');
    }

    setDraggedId(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">VOC 칸반 보드</h1>
          <p className="text-gray-500 mt-1">드래그 앤 드롭으로 VOC 상태를 변경하세요.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">VOC 칸반 보드</h1>
        <p className="text-gray-500 mt-1">드래그 앤 드롭으로 VOC 상태를 변경하세요.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const columnVocs = getVocsByStatus(column.status);
          const isDropTarget = dragOverStatus === column.status;
          return (
            <div
              key={column.status}
              className={`flex-shrink-0 w-72 rounded-lg transition-colors ${
                isDropTarget
                  ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {column.label}
                  </h3>
                  <span className="ml-auto text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {columnVocs.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-2 space-y-2 min-h-[400px]">
                {columnVocs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {isDropTarget ? '여기에 놓으세요' : 'VOC가 없습니다'}
                  </div>
                ) : (
                  columnVocs.map((voc) => (
                    <div
                      key={voc.id}
                      className={`p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                        draggedId === voc.id ? 'opacity-50 scale-95' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, voc.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <Link href={`/voc/${voc.id}`} className="block">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500">
                            {voc.ticketId}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              voc.priority === 'URGENT'
                                ? 'bg-red-100 text-red-700'
                                : voc.priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-700'
                                : voc.priority === 'MEDIUM'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {voc.priority === 'URGENT'
                              ? '긴급'
                              : voc.priority === 'HIGH'
                              ? '높음'
                              : voc.priority === 'MEDIUM'
                              ? '보통'
                              : '낮음'}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {voc.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-2">
                          {voc.customerName}
                        </p>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
