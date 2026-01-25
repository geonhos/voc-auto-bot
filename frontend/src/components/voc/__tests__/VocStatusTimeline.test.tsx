import { render, screen } from '@testing-library/react';
import { VocStatusTimeline } from '../VocStatusTimeline';
import type { VocStatusHistory } from '@/types';

describe('VocStatusTimeline', () => {
  const mockStatusHistory: VocStatusHistory[] = [
    {
      id: 1,
      status: 'RECEIVED',
      statusLabel: '접수',
      createdAt: '2026-01-23T14:30:25Z',
    },
    {
      id: 2,
      status: 'ASSIGNED',
      statusLabel: '배정됨',
      createdAt: '2026-01-23T14:31:15Z',
      changedBy: '김담당자',
    },
    {
      id: 3,
      status: 'IN_PROGRESS',
      statusLabel: '처리중',
      note: '처리 중 (예상: 1-2일 소요)',
      createdAt: '2026-01-23T14:45:30Z',
    },
  ];

  it('renders all status history items', () => {
    render(<VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />);

    expect(screen.getByText('접수')).toBeInTheDocument();
    expect(screen.getByText('배정됨')).toBeInTheDocument();
    expect(screen.getByText('처리중')).toBeInTheDocument();
  });

  it('displays timestamps correctly', () => {
    render(<VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />);

    expect(screen.getByText(/2026-01-23 14:30:25/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-23 14:31:15/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-23 14:45:30/)).toBeInTheDocument();
  });

  it('displays notes when present', () => {
    render(<VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />);

    expect(screen.getByText('처리 중 (예상: 1-2일 소요)')).toBeInTheDocument();
  });

  it('displays changed by when present', () => {
    render(<VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />);

    expect(screen.getByText(/담당자: 김담당자/)).toBeInTheDocument();
  });

  it('highlights current status as in-progress', () => {
    const { container } = render(
      <VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />
    );

    const inProgressIcon = container.querySelector('.bg-blue-600');
    expect(inProgressIcon).toBeInTheDocument();
  });

  it('shows completed status for past items', () => {
    const { container } = render(
      <VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />
    );

    const completedIcons = container.querySelectorAll('.bg-green-600');
    expect(completedIcons.length).toBeGreaterThan(0);
  });
});
