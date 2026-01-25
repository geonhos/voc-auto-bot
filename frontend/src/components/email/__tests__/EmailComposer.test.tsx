import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailComposer } from '../EmailComposer';
import type { EmailTemplate } from '@/types';

describe('EmailComposer', () => {
  const mockTemplate: EmailTemplate = {
    id: 1,
    name: 'VOC 완료 안내',
    type: 'VOC_RESOLVED',
    subject: '[{{ticketId}}] VOC 처리 완료',
    bodyHtml: '<p>고객님의 {{title}} 건이 완료되었습니다.</p>',
    bodyText: '고객님의 {{title}} 건이 완료되었습니다.',
    variables: ['ticketId', 'title'],
    isSystem: true,
    isActive: true,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  };

  const defaultProps = {
    selectedTemplate: mockTemplate,
    recipientEmail: 'test@example.com',
    vocId: 1,
    onSend: jest.fn(),
    onCancel: jest.fn(),
    isSending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders composer with template data', () => {
    render(<EmailComposer {...defaultProps} />);

    expect(screen.getByLabelText(/수신자/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/제목/i)).toHaveValue('[{{ticketId}}] VOC 처리 완료');
    expect(screen.getByLabelText(/본문/i)).toHaveValue('고객님의 {{title}} 건이 완료되었습니다.');
  });

  it('displays placeholder when no template selected', () => {
    render(<EmailComposer {...defaultProps} selectedTemplate={null} />);

    expect(screen.getByText(/템플릿을 선택해주세요/i)).toBeInTheDocument();
  });

  it('renders variable editor for template variables', () => {
    render(<EmailComposer {...defaultProps} />);

    expect(screen.getByLabelText(/VOC 접수번호/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/VOC 제목/i)).toBeInTheDocument();
  });

  it('updates subject when user types', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);

    const subjectInput = screen.getByLabelText(/제목/i);
    await user.clear(subjectInput);
    await user.type(subjectInput, 'New Subject');

    expect(subjectInput).toHaveValue('New Subject');
  });

  it('updates body when user types', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);

    const bodyTextarea = screen.getByLabelText(/본문/i);
    await user.clear(bodyTextarea);
    await user.type(bodyTextarea, 'New body content');

    expect(bodyTextarea).toHaveValue('New body content');
  });

  it('shows character count for body', () => {
    render(<EmailComposer {...defaultProps} />);

    const bodyText = '고객님의 {{title}} 건이 완료되었습니다.';
    expect(screen.getByText(new RegExp(`${bodyText.length} / 2000`))).toBeInTheDocument();
  });

  it('calls onSend with correct data when form is submitted', async () => {
    const user = userEvent.setup();
    const onSend = jest.fn();
    render(<EmailComposer {...defaultProps} onSend={onSend} />);

    // Fill in variables
    const ticketIdInput = screen.getByLabelText(/VOC 접수번호/i);
    const titleInput = screen.getByLabelText(/VOC 제목/i);

    await user.type(ticketIdInput, 'VOC-001');
    await user.type(titleInput, '로그인 오류');

    // Submit
    const sendButton = screen.getByRole('button', { name: /발송/i });
    await user.click(sendButton);

    expect(onSend).toHaveBeenCalledWith({
      templateId: 1,
      recipient: 'test@example.com',
      subject: '[VOC-001] VOC 처리 완료',
      body: '고객님의 로그인 오류 건이 완료되었습니다.',
      variables: {
        ticketId: 'VOC-001',
        title: '로그인 오류',
      },
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<EmailComposer {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /취소/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables send button when sending', () => {
    render(<EmailComposer {...defaultProps} isSending={true} />);

    const sendButton = screen.getByRole('button', { name: /발송 중/i });
    expect(sendButton).toBeDisabled();
  });

  it('opens preview modal when preview button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);

    const previewButton = screen.getByRole('button', { name: /미리보기/i });
    await user.click(previewButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /이메일 미리보기/i })).toBeInTheDocument();
    });
  });
});
