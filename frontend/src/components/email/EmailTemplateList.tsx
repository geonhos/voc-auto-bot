'use client';

import { useState } from 'react';
import type { EmailTemplate } from '@/types';

interface EmailTemplateListProps {
  templates: EmailTemplate[];
  selectedTemplateId: number | null;
  onSelectTemplate: (template: EmailTemplate) => void;
  isLoading?: boolean;
}

type ViewMode = 'card' | 'list';

/**
 * @description Email template list component
 * Displays templates in card or list view with selection capability
 */
export function EmailTemplateList({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  isLoading = false,
}: EmailTemplateListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates based on search query
  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.subject.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          이메일 템플릿
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="템플릿 검색..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTemplates.length}개 템플릿
          </span>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label="카드 뷰"
            >
              <span className="material-icons-outlined text-lg">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              aria-label="리스트 뷰"
            >
              <span className="material-icons-outlined text-lg">list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template List */}
      <div className="flex-grow overflow-y-auto px-6 py-4">
        {filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <p>검색 결과가 없습니다</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={template.id === selectedTemplateId}
                onSelect={() => onSelectTemplate(template)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                isSelected={template.id === selectedTemplateId}
                onSelect={() => onSelectTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Template card component
 */
function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: EmailTemplate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {template.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getTemplateTypeLabel(template.type)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {template.isSystem && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
              시스템
            </span>
          )}
          <span
            className={`w-2 h-2 rounded-full ${
              template.isActive ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={template.isActive ? '활성' : '비활성'}
          />
        </div>
      </div>

      {/* Subject */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-1">
        {template.subject}
      </p>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.variables.map((variable) => (
            <span
              key={variable}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {`{{${variable}}}`}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

/**
 * Template list item component
 */
function TemplateListItem({
  template,
  isSelected,
  onSelect,
}: {
  template: EmailTemplate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {template.name}
            </h3>
            {template.isSystem && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                시스템
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            {template.subject}
          </p>
        </div>
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ml-4 ${
            template.isActive ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={template.isActive ? '활성' : '비활성'}
        />
      </div>
    </button>
  );
}

/**
 * Helper function to get template type label
 */
function getTemplateTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    VOC_RECEIVED: 'VOC 접수 안내',
    VOC_IN_PROGRESS: 'VOC 처리 중',
    VOC_RESOLVED: 'VOC 완료 안내',
    VOC_REJECTED: 'VOC 반려 안내',
    CUSTOM: '사용자 정의',
  };

  return labels[type] || type;
}
