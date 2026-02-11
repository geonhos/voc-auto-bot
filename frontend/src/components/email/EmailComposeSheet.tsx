'use client';

import { EmailComposeForm } from '@/components/email/EmailComposeForm';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useEmailComposeViewModel } from '@/hooks/useEmailComposeViewModel';
import { useToast } from '@/hooks/useToast';

interface EmailComposeSheetProps {
  vocId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailComposeSheet({ vocId, open, onOpenChange }: EmailComposeSheetProps) {
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
      onOpenChange(false);
    },
    onError: (err) => {
      toastError(err.message || '이메일 발송 중 오류가 발생했습니다.');
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <span className="material-icons-outlined text-primary text-xl">email</span>
            이메일 작성
          </SheetTitle>
          <SheetDescription>
            VOC 관련 이메일을 작성하여 고객에게 발송합니다.
          </SheetDescription>
        </SheetHeader>
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
      </SheetContent>
    </Sheet>
  );
}
