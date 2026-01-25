import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VocStatusLookup } from '../VocStatusLookup';
import { useVocStatusLookup } from '@/hooks/useVocStatus';
import type { VocStatusDetail } from '@/types';

jest.mock('@/hooks/useVocStatus');

const mockUseVocStatusLookup = useVocStatusLookup as jest.MockedFunction<typeof useVocStatusLookup>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('VocStatusLookup', () => {
  const mockMutateAsync = jest.fn();
  const mockMutation = {
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVocStatusLookup.mockReturnValue(mockMutation as any);
  });

  it('renders form fields correctly', () => {
    render(<VocStatusLookup />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/ticket id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/최종 사용자 이메일/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /초기화/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /조회/i })).toBeInTheDocument();
  });

  it('validates required ticket ID', async () => {
    const user = userEvent.setup();
    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /조회/i });
    await user.click(submitButton);

    expect(await screen.findByText(/티켓 id를 입력해주세요/i)).toBeInTheDocument();
  });

  it('validates ticket ID format', async () => {
    const user = userEvent.setup();
    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const ticketIdInput = screen.getByLabelText(/ticket id/i);
    await user.type(ticketIdInput, 'INVALID-FORMAT');

    const submitButton = screen.getByRole('button', { name: /조회/i });
    await user.click(submitButton);

    expect(await screen.findByText(/올바른 티켓 id 형식이 아닙니다/i)).toBeInTheDocument();
  });

  it('validates required email', async () => {
    const user = userEvent.setup();
    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const ticketIdInput = screen.getByLabelText(/ticket id/i);
    await user.type(ticketIdInput, 'VOC-20260123-00001');

    const submitButton = screen.getByRole('button', { name: /조회/i });
    await user.click(submitButton);

    expect(await screen.findByText(/이메일 주소를 입력해주세요/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const emailInput = screen.getByLabelText(/최종 사용자 이메일/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /조회/i });
    await user.click(submitButton);

    expect(await screen.findByText(/올바른 이메일 형식이 아닙니다/i)).toBeInTheDocument();
  });

  it('submits valid form and displays result', async () => {
    const user = userEvent.setup();
    const mockVocStatus: VocStatusDetail = {
      ticketId: 'VOC-20260123-00001',
      title: '테스트 VOC',
      content: '테스트 내용',
      status: 'IN_PROGRESS',
      statusLabel: '처리중',
      category: '오류/버그',
      priority: 'HIGH',
      createdAt: '2026-01-23T14:30:25Z',
      updatedAt: '2026-01-23T14:45:30Z',
      statusHistory: [
        {
          id: 1,
          status: 'RECEIVED',
          statusLabel: '접수',
          createdAt: '2026-01-23T14:30:25Z',
        },
      ],
    };

    mockMutateAsync.mockResolvedValueOnce(mockVocStatus);

    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const ticketIdInput = screen.getByLabelText(/ticket id/i);
    const emailInput = screen.getByLabelText(/최종 사용자 이메일/i);

    await user.type(ticketIdInput, 'VOC-20260123-00001');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /조회/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        ticketId: 'VOC-20260123-00001',
        customerEmail: 'test@example.com',
      });
    });
  });

  it('displays not found message when VOC not found', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce({
      response: { status: 404 },
    });

    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const ticketIdInput = screen.getByLabelText(/ticket id/i);
    const emailInput = screen.getByLabelText(/최종 사용자 이메일/i);

    await user.type(ticketIdInput, 'VOC-20260123-99999');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /조회/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/조회 결과가 없습니다/i)).toBeInTheDocument();
    });
  });

  it('resets form on reset button click', async () => {
    const user = userEvent.setup();
    render(<VocStatusLookup />, { wrapper: createWrapper() });

    const ticketIdInput = screen.getByLabelText(/ticket id/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/최종 사용자 이메일/i) as HTMLInputElement;

    await user.type(ticketIdInput, 'VOC-20260123-00001');
    await user.type(emailInput, 'test@example.com');

    const resetButton = screen.getByRole('button', { name: /초기화/i });
    await user.click(resetButton);

    expect(ticketIdInput.value).toBe('');
    expect(emailInput.value).toBe('');
  });
});
