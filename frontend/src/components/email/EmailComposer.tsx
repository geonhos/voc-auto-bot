'use client';

import { useState, useMemo, FormEvent } from 'react';
import type { EmailTemplate, EmailPreviewData, TemplateVariable } from '@/types';
import { EmailPreview } from './EmailPreview';
import { VariableEditor } from './VariableEditor';

interface EmailComposerProps {
  selectedTemplate: EmailTemplate | null;
  recipientEmail: string;
  vocId: number;
  onSend: (data: {
    templateId: number;
    recipient: string;
    subject: string;
    body: string;
    variables: Record<string, string>;
  }) => void;
  onCancel: () => void;
  isSending: boolean;
}

/**
 * @description Email composition component with template variable substitution
 * Handles email form state, variable input, and real-time preview
 */
export function EmailComposer({
  selectedTemplate,
  recipientEmail,
  vocId,
  onSend,
  onCancel,
  isSending,
}: EmailComposerProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Initialize form when template changes
  useMemo(() => {
    if (selectedTemplate) {
      setSubject(selectedTemplate.subject);
      setBody(selectedTemplate.bodyText || selectedTemplate.bodyHtml);

      // Initialize variable values
      const initialValues: Record<string, string> = {};
      selectedTemplate.variables.forEach((varKey) => {
        initialValues[varKey] = '';
      });
      setVariableValues(initialValues);
    }
  }, [selectedTemplate]);

  // Parse template variables
  const templateVariables: TemplateVariable[] = useMemo(() => {
    if (!selectedTemplate) return [];

    return selectedTemplate.variables.map((varKey) => ({
      key: varKey,
      label: getVariableLabel(varKey),
      value: variableValues[varKey] || '',
      required: true,
    }));
  }, [selectedTemplate, variableValues]);

  // Apply variable substitution
  const applyVariables = (text: string): string => {
    let result = text;
    Object.entries(variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  // Preview data with variable substitution
  const previewData: EmailPreviewData = useMemo(() => ({
    recipient: recipientEmail,
    subject: applyVariables(subject),
    body: applyVariables(body),
  }), [recipientEmail, subject, body, variableValues]);

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate) return;

    onSend({
      templateId: selectedTemplate.id,
      recipient: recipientEmail,
      subject: previewData.subject,
      body: previewData.body,
      variables: variableValues,
    });
  };

  if (!selectedTemplate) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <p>템플릿을 선택해주세요</p>
      </div>
    );
  }

  const charCount = body.length;
  const maxChars = 2000;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          이메일 발송
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            <span className="material-icons-outlined text-lg">visibility</span>
            미리보기
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="닫기"
          >
            <span className="material-icons-outlined text-gray-600 dark:text-gray-300">
              close
            </span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* Recipient */}
          <div>
            <label
              htmlFor="email-recipient"
              className="block text-sm font-semibold mb-2 after:content-['*'] after:ml-1 after:text-red-500 text-gray-900 dark:text-gray-100"
            >
              수신자
            </label>
            <input
              id="email-recipient"
              type="email"
              value={recipientEmail}
              readOnly
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-not-allowed"
              aria-required="true"
              aria-describedby="recipient-help"
            />
            <p id="recipient-help" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              VOC 접수 시 입력된 최종 사용자 이메일
            </p>
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="email-subject"
              className="block text-sm font-semibold mb-2 after:content-['*'] after:ml-1 after:text-red-500 text-gray-900 dark:text-gray-100"
            >
              제목
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="이메일 제목을 입력하세요"
              maxLength={200}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              aria-required="true"
            />
          </div>

          {/* Template Variables */}
          {templateVariables.length > 0 && (
            <VariableEditor
              variables={templateVariables}
              onVariableChange={handleVariableChange}
            />
          )}

          {/* Body */}
          <div>
            <label
              htmlFor="email-body"
              className="block text-sm font-semibold mb-2 after:content-['*'] after:ml-1 after:text-red-500 text-gray-900 dark:text-gray-100"
            >
              본문
            </label>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              maxLength={maxChars}
              placeholder="이메일 본문을 입력하세요"
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              aria-required="true"
              aria-describedby="body-char-count"
            />
            <div className="flex items-center justify-end mt-1">
              <span
                id="body-char-count"
                aria-live="polite"
                className="text-xs text-gray-500 dark:text-gray-400 tabular-nums"
              >
                {charCount} / {maxChars}자
              </span>
            </div>
          </div>

          {/* Variable Info */}
          {selectedTemplate.variables.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex gap-2 mb-2">
                <span className="material-icons-outlined text-blue-600 dark:text-blue-400 text-lg">
                  info
                </span>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  사용 가능한 변수
                </p>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-7">
                {selectedTemplate.variables.map((varKey) => (
                  <li key={varKey}>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      {`{{${varKey}}}`}
                    </code>
                    {' - '}
                    {getVariableLabel(varKey)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSending}
          className="px-6 py-3 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-icons-outlined text-lg">send</span>
          {isSending ? '발송 중...' : '발송'}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <EmailPreview preview={previewData} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

/**
 * Helper function to get variable label
 */
function getVariableLabel(key: string): string {
  const labels: Record<string, string> = {
    ticketId: 'VOC 접수번호',
    title: 'VOC 제목',
    status: '처리 상태',
    processingNote: '처리 내용',
    rejectReason: '반려 사유',
    customerName: '고객명',
    assigneeName: '담당자명',
    dueDate: '처리 기한',
    createdAt: '등록일시',
  };

  return labels[key] || key;
}
