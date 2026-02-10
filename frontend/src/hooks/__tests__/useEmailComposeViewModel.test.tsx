import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';

import type { Voc, EmailTemplate } from '@/types';

import { useEmailComposeViewModel } from '../useEmailComposeViewModel';
import { useVoc } from '../useVocs';
import { useEmailTemplates, useSendEmail } from '../useEmails';

jest.mock('../useVocs');
jest.mock('../useEmails');

const mockVoc: Voc = {
  id: 1,
  ticketId: 'VOC-2024-0001',
  title: '제품 배송 지연 문의',
  content: '주문한 상품이 아직 도착하지 않았습니다.',
  status: 'NEW',
  priority: 'NORMAL',
  channel: 'WEB',
  customerName: '홍길동',
  customerEmail: 'hong@example.com',
  category: { id: 1, name: '제품 문의', code: 'PRODUCT' },
  attachments: [],
  memos: [],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'VOC 접수 안내',
    type: 'VOC_RECEIVED',
    subject: '[VOC] 접수가 완료되었습니다 - {{ticketId}}',
    bodyHtml: '<p>안녕하세요, {{customerName}}님. 문의가 접수되었습니다.</p>',
    bodyText: '안녕하세요, {{customerName}}님. 문의가 접수되었습니다.',
    variables: ['ticketId', 'customerName', 'title'],
    isSystem: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

function setupMocks(overrides: {
  voc?: Voc | null;
  isVocLoading?: boolean;
  templates?: EmailTemplate[];
  isTemplatesLoading?: boolean;
  mutateAsync?: jest.Mock;
  isPending?: boolean;
} = {}) {
  const {
    voc,
    isVocLoading = false,
    templates = mockTemplates,
    isTemplatesLoading = false,
    mutateAsync = jest.fn().mockResolvedValue({ id: 1, recipientEmail: 'hong@example.com', recipientName: '홍길동', subject: 'Test', status: 'SENT', sentAt: null, errorMessage: null }),
    isPending = false,
  } = overrides;

  const resolvedVoc = voc === null ? undefined : (voc ?? mockVoc);

  (useVoc as jest.Mock).mockReturnValue({
    data: resolvedVoc,
    isLoading: isVocLoading,
  });
  (useEmailTemplates as jest.Mock).mockReturnValue({
    data: templates,
    isLoading: isTemplatesLoading,
  });
  (useSendEmail as jest.Mock).mockReturnValue({
    mutateAsync,
    isPending,
  });
}

describe('useEmailComposeViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct initial form state', () => {
    setupMocks({ voc: null });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: undefined }),
      { wrapper: createWrapper() }
    );

    expect(result.current.form).toEqual({
      recipientEmail: '',
      recipientName: '',
      subject: '',
      body: '',
      templateId: null,
    });
  });

  it('should auto-fill recipient from VOC data', async () => {
    setupMocks();

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
      expect(result.current.form.recipientName).toBe('홍길동');
    });
  });

  it('should update a single field with updateField', () => {
    setupMocks({ voc: null });

    const { result } = renderHook(
      () => useEmailComposeViewModel({}),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.updateField('subject', '새로운 제목');
    });

    expect(result.current.form.subject).toBe('새로운 제목');
  });

  it('should auto-fill subject and body when selecting a template', async () => {
    setupMocks();

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.selectTemplate(1);
    });

    expect(result.current.form.templateId).toBe(1);
    expect(result.current.form.subject).toBe('[VOC] 접수가 완료되었습니다 - VOC-2024-0001');
    expect(result.current.form.body).toContain('홍길동');
  });

  it('should clear templateId when manually editing subject after template selection', async () => {
    setupMocks();

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.selectTemplate(1);
    });

    expect(result.current.form.templateId).toBe(1);

    act(() => {
      result.current.updateField('subject', '수동으로 수정한 제목');
    });

    expect(result.current.form.templateId).toBeNull();
    expect(result.current.form.subject).toBe('수동으로 수정한 제목');
  });

  it('should clear templateId when manually editing body after template selection', async () => {
    setupMocks();

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.selectTemplate(1);
    });

    act(() => {
      result.current.updateField('body', '직접 입력한 본문');
    });

    expect(result.current.form.templateId).toBeNull();
  });

  it('should clear subject and body when deselecting template (null)', async () => {
    setupMocks();

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.selectTemplate(1);
    });

    act(() => {
      result.current.selectTemplate(null);
    });

    expect(result.current.form.templateId).toBeNull();
    expect(result.current.form.subject).toBe('');
    expect(result.current.form.body).toBe('');
  });

  it('should call mutateAsync on handleSend with direct send', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({
      id: 1,
      recipientEmail: 'hong@example.com',
      recipientName: '홍길동',
      subject: '직접 제목',
      status: 'SENT',
      sentAt: null,
      errorMessage: null,
    });
    const onSuccess = jest.fn();

    setupMocks({ mutateAsync: mockMutateAsync });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1, onSuccess }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.updateField('subject', '직접 제목');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'hong@example.com',
        subject: '직접 제목',
      })
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should set error when recipientEmail is empty on handleSend', async () => {
    const onError = jest.fn();
    setupMocks({ voc: null });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ onError }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.sendError).toBeTruthy();
    expect(result.current.sendError?.message).toContain('수신자 이메일');
    expect(onError).toHaveBeenCalled();
  });

  it('should set error when no template and no subject on handleSend', async () => {
    const onError = jest.fn();
    setupMocks({ voc: null });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ onError }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.updateField('recipientEmail', 'test@example.com');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.sendError).toBeTruthy();
    expect(result.current.sendError?.message).toContain('템플릿');
    expect(onError).toHaveBeenCalled();
  });

  it('should handle send failure gracefully', async () => {
    const sendError = new Error('네트워크 오류');
    const mockMutateAsync = jest.fn().mockRejectedValue(sendError);
    const onError = jest.fn();

    setupMocks({ mutateAsync: mockMutateAsync });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1, onError }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.updateField('subject', '제목');
    });

    await act(async () => {
      await result.current.handleSend();
    });

    expect(result.current.sendError).toBe(sendError);
    expect(onError).toHaveBeenCalledWith(sendError);
  });

  it('should reset form to initial state with VOC recipient', async () => {
    setupMocks();

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.form.recipientEmail).toBe('hong@example.com');
    });

    act(() => {
      result.current.updateField('subject', '임시 제목');
      result.current.updateField('body', '임시 본문');
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.form.subject).toBe('');
    expect(result.current.form.body).toBe('');
    expect(result.current.form.templateId).toBeNull();
    expect(result.current.form.recipientEmail).toBe('hong@example.com');
    expect(result.current.form.recipientName).toBe('홍길동');
    expect(result.current.sendError).toBeNull();
  });

  it('should expose loading states from dependent hooks', () => {
    setupMocks({ isVocLoading: true, isTemplatesLoading: true });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isVocLoading).toBe(true);
    expect(result.current.isTemplatesLoading).toBe(true);
  });

  it('should expose isSending from mutation', () => {
    setupMocks({ isPending: true });

    const { result } = renderHook(
      () => useEmailComposeViewModel({ vocId: 1 }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isSending).toBe(true);
  });
});
