import { render, screen } from '@testing-library/react';
import { VocStatusTimeline } from '../VocStatusTimeline';

describe('VocStatusTimeline', () => {
  const mockStatusHistory = [
    { id: 1, status: 'RECEIVED' as const, statusLabel: '접수', createdAt: '2026-01-23T14:30:25Z' },
    { id: 2, status: 'IN_PROGRESS' as const, statusLabel: '처리중', note: '처리 중', createdAt: '2026-01-23T14:45:30Z' },
  ];

  it('renders all status history items', () => {
    render(<VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />);
    expect(screen.getByText('접수')).toBeInTheDocument();
    expect(screen.getByText('처리중')).toBeInTheDocument();
  });

  it('displays timestamps correctly', () => {
    render(<VocStatusTimeline statusHistory={mockStatusHistory} currentStatus="IN_PROGRESS" />);
    expect(screen.getByText(/2026-01-23 14:30:25/)).toBeInTheDocument();
    expect(screen.getByText(/2026-01-23 14:45:30/)).toBeInTheDocument();
  });
});
