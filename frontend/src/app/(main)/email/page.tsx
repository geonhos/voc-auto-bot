'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailTemplateList } from '@/components/email/EmailTemplateList';
import { EmailComposer } from '@/components/email/EmailComposer';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import { useSendEmail } from '@/hooks/useSendEmail';
import type { EmailTemplate } from '@/types';

/**
 * @description Email sending page (SC-08)
 * Provides template-based email composition and sending interface
 */
export default function EmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get vocId and recipientEmail from query params
  const vocId = parseInt(searchParams.get('vocId') || '0', 10);
  const recipientEmail = searchParams.get('email') || '';

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Fetch active templates only
  const { data: templates = [], isLoading } = useEmailTemplates(true);

  // Send email mutation
  const { mutate: sendEmail, isPending: isSending } = useSendEmail({
    onSuccess: () => {
      alert('이메일이 성공적으로 발송되었습니다.');
      router.back();
    },
    onError: (error) => {
      alert(`이메일 발송 실패: ${error.message}`);
    },
  });

  const handleSendEmail = (data: {
    templateId: number;
    recipient: string;
    subject: string;
    body: string;
    variables: Record<string, string>;
  }) => {
    if (!vocId) {
      alert('VOC ID가 유효하지 않습니다.');
      return;
    }

    sendEmail({
      vocId,
      templateId: data.templateId,
      recipient: data.recipient,
      subject: data.subject,
      body: data.body,
      variables: data.variables,
    });
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 나가시겠습니까?')) {
      router.back();
    }
  };

  // Validation
  if (!vocId || !recipientEmail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 max-w-md">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <span className="material-icons-outlined text-red-600 dark:text-red-400">
                error
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              잘못된 접근
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            VOC ID 또는 이메일 주소가 유효하지 않습니다. VOC 상세 페이지에서 이메일 발송을
            시도해주세요.
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-primary text-white font-semibold rounded hover:bg-primary-dark transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="뒤로 가기"
            >
              <span className="material-icons-outlined text-gray-600 dark:text-gray-300">
                arrow_back
              </span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              이메일 발송
            </h1>
          </div>
          <p className="ml-12 text-sm text-gray-600 dark:text-gray-400">
            템플릿을 선택하고 이메일을 작성하여 발송하세요
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-12rem)] overflow-hidden">
              <EmailTemplateList
                templates={templates}
                selectedTemplateId={selectedTemplate?.id || null}
                onSelectTemplate={setSelectedTemplate}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Right: Email Composer */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[calc(100vh-12rem)] overflow-hidden">
              <EmailComposer
                selectedTemplate={selectedTemplate}
                recipientEmail={recipientEmail}
                vocId={vocId}
                onSend={handleSendEmail}
                onCancel={handleCancel}
                isSending={isSending}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
