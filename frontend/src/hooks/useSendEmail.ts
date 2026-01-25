'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '@/lib/api/emailApi';
import type { SendEmailRequest, EmailLog } from '@/types';

interface UseSendEmailOptions {
  onSuccess?: (data: EmailLog) => void;
  onError?: (error: Error) => void;
}

/**
 * @description Hook for sending email
 */
export function useSendEmail(options?: UseSendEmailOptions) {
  const queryClient = useQueryClient();

  return useMutation<EmailLog, Error, SendEmailRequest>({
    mutationFn: (data: SendEmailRequest) => emailApi.sendEmail(data),
    onSuccess: (data, variables) => {
      // Invalidate email logs for this VOC
      queryClient.invalidateQueries({ queryKey: ['emailLogs', variables.vocId] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * @description Hook for resending failed email
 */
export function useResendEmail(options?: UseSendEmailOptions) {
  const queryClient = useQueryClient();

  return useMutation<EmailLog, Error, number>({
    mutationFn: (logId: number) => emailApi.resendEmail(logId),
    onSuccess: (data) => {
      // Invalidate email logs
      queryClient.invalidateQueries({ queryKey: ['emailLogs'] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
