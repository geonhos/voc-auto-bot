import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface FeedbackRequest {
  requestId: string;
  feedback: 'GOOD' | 'BAD';
}

interface FeedbackResponse {
  status: string;
  request_id: string;
  feedback: string;
}

/**
 * AI 분석 결과에 대한 피드백(thumbs up/down)을 제출하는 hook.
 *
 * 사용법:
 *   const { mutate, isPending } = useAiFeedback();
 *   mutate({ requestId: '...', feedback: 'GOOD' });
 */
export function useAiFeedback() {
  return useMutation({
    mutationFn: async ({ requestId, feedback }: FeedbackRequest) => {
      const response = await api.post<FeedbackResponse>('/ai/feedback', {
        request_id: requestId,
        feedback,
      });
      return response.data;
    },
  });
}
