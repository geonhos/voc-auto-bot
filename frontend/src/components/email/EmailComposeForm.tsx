'use client';

import { cn } from '@/lib/utils';
import type { Voc, EmailTemplate } from '@/types';
import type { EmailComposeFormState } from '@/hooks/useEmailComposeViewModel';

interface EmailComposeFormProps {
  form: EmailComposeFormState;
  voc: Voc | undefined;
  isVocLoading: boolean;
  templates: EmailTemplate[];
  isTemplatesLoading: boolean;
  isSending: boolean;
  sendError: Error | null;
  onUpdateField: <K extends keyof EmailComposeFormState>(field: K, value: EmailComposeFormState[K]) => void;
  onSelectTemplate: (templateId: number | null) => void;
  onSend: () => void;
  onReset: () => void;
}

/**
 * VOC reference information card displayed in the compose form.
 */
function VocReferenceCard({ voc, isLoading }: { voc: Voc | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons-outlined text-primary text-sm">info</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">VOC 참조 정보</span>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!voc) {
    return null;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-icons-outlined text-primary text-sm">info</span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">VOC 참조 정보</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Ticket ID</span>
          <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{voc.ticketId}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">고객명</span>
          <p className="font-medium text-slate-800 dark:text-slate-200">{voc.customerName}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">제목</span>
          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{voc.title}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">카테고리</span>
          <p className="font-medium text-slate-800 dark:text-slate-200">{voc.category?.name || '-'}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">상태</span>
          <p className="font-medium text-slate-800 dark:text-slate-200">{voc.status}</p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">이메일</span>
          <p className="font-medium text-slate-800 dark:text-slate-200">{voc.customerEmail}</p>
        </div>
      </div>
    </div>
  );
}

export function EmailComposeForm({
  form,
  voc,
  isVocLoading,
  templates,
  isTemplatesLoading,
  isSending,
  sendError,
  onUpdateField,
  onSelectTemplate,
  onSend,
  onReset,
}: EmailComposeFormProps) {
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSelectTemplate(value ? Number(value) : null);
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {sendError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
          <p className="text-sm text-red-700 dark:text-red-400">
            {sendError.message || '이메일 발송에 실패했습니다.'}
          </p>
        </div>
      )}

      {/* VOC Reference Card */}
      <VocReferenceCard voc={voc} isLoading={isVocLoading} />

      {/* Template Selection */}
      <div>
        <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          이메일 템플릿
        </label>
        <select
          id="template"
          value={form.templateId ?? ''}
          onChange={handleTemplateChange}
          disabled={isTemplatesLoading}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800',
            'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100'
          )}
        >
          <option value="">템플릿 없이 직접 작성</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {isTemplatesLoading && (
          <p className="mt-1 text-xs text-slate-500">템플릿 목록을 불러오는 중...</p>
        )}
      </div>

      {/* Recipient Email */}
      <div>
        <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          수신자 이메일 <span className="text-red-500">*</span>
        </label>
        <input
          id="recipientEmail"
          type="email"
          value={form.recipientEmail}
          onChange={(e) => onUpdateField('recipientEmail', e.target.value)}
          placeholder="수신자 이메일을 입력하세요"
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800',
            'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100'
          )}
        />
      </div>

      {/* Recipient Name */}
      <div>
        <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          수신자 이름
        </label>
        <input
          id="recipientName"
          type="text"
          value={form.recipientName}
          onChange={(e) => onUpdateField('recipientName', e.target.value)}
          placeholder="수신자 이름을 입력하세요"
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800',
            'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100'
          )}
        />
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          제목 {!form.templateId && <span className="text-red-500">*</span>}
        </label>
        <input
          id="subject"
          type="text"
          value={form.subject}
          onChange={(e) => onUpdateField('subject', e.target.value)}
          placeholder="이메일 제목을 입력하세요"
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
            'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800',
            'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100'
          )}
        />
        {form.templateId && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            템플릿 사용 시 제목은 템플릿에서 자동으로 설정됩니다. 위 내용은 미리보기입니다.
          </p>
        )}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          본문 {!form.templateId && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="body"
          value={form.body}
          onChange={(e) => onUpdateField('body', e.target.value)}
          rows={12}
          placeholder="이메일 본문을 입력하세요"
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none',
            'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800',
            'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100'
          )}
        />
        {form.templateId && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            템플릿 사용 시 본문은 템플릿에서 자동으로 설정됩니다. 위 내용은 미리보기입니다.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onReset}
          disabled={isSending}
          className={cn(
            'px-6 py-2.5 text-sm font-medium rounded-lg border transition-colors',
            isSending
              ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
          )}
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={isSending}
          className={cn(
            'px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2',
            isSending
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {isSending ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              발송 중...
            </>
          ) : (
            <>
              <span className="material-icons-outlined text-sm">send</span>
              이메일 발송
            </>
          )}
        </button>
      </div>
    </div>
  );
}
