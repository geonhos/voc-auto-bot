'use client';

import { MailIcon, PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';

interface EmailTemplate {
  id: number;
  name: string;
  code: string;
  subject: string;
  isActive: boolean;
  isSystem: boolean;
}

const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'VOC 접수 완료 안내',
    code: 'VOC_RECEIVED',
    subject: '[{{ticketId}}] VOC가 접수되었습니다',
    isActive: true,
    isSystem: true,
  },
  {
    id: 2,
    name: 'VOC 처리 완료 안내',
    code: 'VOC_COMPLETED',
    subject: '[{{ticketId}}] VOC 처리가 완료되었습니다',
    isActive: true,
    isSystem: true,
  },
  {
    id: 3,
    name: 'VOC 반려 안내',
    code: 'VOC_REJECTED',
    subject: '[{{ticketId}}] VOC 처리 결과 안내',
    isActive: true,
    isSystem: true,
  },
  {
    id: 4,
    name: '담당자 배정 안내 (내부용)',
    code: 'ASSIGNEE_NOTIFICATION',
    subject: '[내부] 새로운 VOC가 배정되었습니다 - {{ticketId}}',
    isActive: true,
    isSystem: true,
  },
];

export default function EmailTemplatesPage() {
  const [templates] = useState<EmailTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">이메일 템플릿</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          VOC 관련 이메일 템플릿을 관리합니다.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Template List */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-medium text-gray-900 dark:text-gray-100">템플릿 목록</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="h-4 w-4" />
              새 템플릿
            </button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {template.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.isSystem && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        시스템
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        template.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {template.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {template.subject}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Template Detail */}
        <div className="w-96 bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-gray-900 dark:text-gray-100">상세 정보</h2>
          </div>

          <div className="p-4">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    템플릿명
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {selectedTemplate.name}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    코드
                  </label>
                  <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {selectedTemplate.code}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    제목
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedTemplate.subject}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    상태
                  </label>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      selectedTemplate.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {selectedTemplate.isActive ? '활성' : '비활성'}
                  </span>
                </div>

                {!selectedTemplate.isSystem && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <EditIcon className="h-4 w-4" />
                      수정
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                      <TrashIcon className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                )}

                {selectedTemplate.isSystem && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic pt-4 border-t border-gray-200 dark:border-gray-700">
                    시스템 템플릿은 수정 및 삭제할 수 없습니다.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                템플릿을 선택해주세요
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
