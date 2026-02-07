'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { EmailComposeForm } from '@/components/email/EmailComposeForm';
import { useEmailComposeViewModel } from '@/hooks/useEmailComposeViewModel';
import { useToast } from '@/hooks/useToast';

function EmailComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vocIdParam = searchParams.get('vocId');
  const vocId = vocIdParam ? Number(vocIdParam) : undefined;

  const { success, error: toastError } = useToast();

  const viewModel = useEmailComposeViewModel({
    vocId,
    onSuccess: (response) => {
      if (response.status === 'SENT') {
        success('이메일이 성공적으로 발송되었습니다.');
      } else if (response.status === 'PENDING') {
        success('이메일 발송이 요청되었습니다. 잠시 후 발송됩니다.');
      } else {
        toastError(response.errorMessage || '이메일 발송에 실패했습니다.');
      }

      // Navigate back to VOC detail if vocId exists, otherwise to VOC list
      if (vocId) {
        router.push(`/voc/${vocId}`);
      } else {
        router.push('/voc/table');
      }
    },
    onError: (err) => {
      toastError(err.message || '이메일 발송 중 오류가 발생했습니다.');
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href={vocId ? `/voc/${vocId}` : '/voc/table'}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <span className="material-icons-outlined text-sm">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">이메일 작성</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {vocId
            ? 'VOC 관련 이메일을 작성하여 고객에게 발송합니다.'
            : '이메일을 작성하여 발송합니다.'}
        </p>
      </div>

      {/* Compose Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-icons-outlined text-primary">email</span>
            이메일 작성
          </h2>
        </div>
        <div className="p-6">
          <EmailComposeForm
            form={viewModel.form}
            voc={viewModel.voc}
            isVocLoading={viewModel.isVocLoading}
            templates={viewModel.templates}
            isTemplatesLoading={viewModel.isTemplatesLoading}
            isSending={viewModel.isSending}
            sendError={viewModel.sendError}
            onUpdateField={viewModel.updateField}
            onSelectTemplate={viewModel.selectTemplate}
            onSend={viewModel.handleSend}
            onReset={viewModel.resetForm}
          />
        </div>
      </div>
    </div>
  );
}

export default function EmailComposePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      }
    >
      <EmailComposeContent />
    </Suspense>
  );
}
