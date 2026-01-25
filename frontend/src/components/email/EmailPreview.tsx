'use client';

import type { EmailPreviewData } from '@/types';

interface EmailPreviewProps {
  preview: EmailPreviewData;
  onClose: () => void;
}

/**
 * @description Email preview modal component
 * Displays email with variable substitution applied
 */
export function EmailPreview({ preview, onClose }: EmailPreviewProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-labelledby="preview-modal-title"
        aria-modal="true"
        className="relative z-70 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="preview-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            이메일 미리보기
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="닫기"
          >
            <span className="material-icons-outlined text-gray-600 dark:text-gray-300">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Recipient */}
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                수신자
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{preview.recipient}</p>
            </div>

            {/* Subject */}
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                제목
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {preview.subject}
              </p>
            </div>

            {/* Body */}
            <div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                본문
              </p>
              <div className="p-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {preview.body}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
