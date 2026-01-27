import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SimilarVocCard } from '../SimilarVocCard';

const mockSimilarVoc = {
  id: 2,
  ticketId: 'VOC-20260123-00002',
  title: '로그인 오류 문의',
  status: 'RESOLVED' as const,
  similarity: 0.92,
  createdAt: '2026-01-23T10:00:00Z',
};

describe('SimilarVocCard', () => {
  it('renders similar VOC information correctly', () => {
    render(<SimilarVocCard voc={mockSimilarVoc} />);

    expect(screen.getByText('VOC-20260123-00002')).toBeInTheDocument();
    expect(screen.getByText('로그인 오류 문의')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('displays similarity percentage correctly', () => {
    const lowSimilarityVoc = { ...mockSimilarVoc, similarity: 0.45 };
    render(<SimilarVocCard voc={lowSimilarityVoc} />);

    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<SimilarVocCard voc={mockSimilarVoc} onClick={handleClick} />);

    await user.click(screen.getByRole('button', { name: /유사 VOC VOC-20260123-00002/i }));

    expect(handleClick).toHaveBeenCalledWith(2);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick handler on Enter key press', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<SimilarVocCard voc={mockSimilarVoc} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /유사 VOC VOC-20260123-00002/i });
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledWith(2);
  });

  it('calls onClick handler on Space key press', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<SimilarVocCard voc={mockSimilarVoc} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /유사 VOC VOC-20260123-00002/i });
    card.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledWith(2);
  });

  it('applies correct similarity color for high similarity (>80%)', () => {
    const { container } = render(<SimilarVocCard voc={mockSimilarVoc} />);

    const badge = screen.getByText('92%');
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');
  });

  it('applies correct similarity color for medium-high similarity (60-79%)', () => {
    const mediumVoc = { ...mockSimilarVoc, similarity: 0.65 };
    render(<SimilarVocCard voc={mediumVoc} />);

    const badge = screen.getByText('65%');
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-700');
  });

  it('applies correct similarity color for medium similarity (40-59%)', () => {
    const mediumVoc = { ...mockSimilarVoc, similarity: 0.45 };
    render(<SimilarVocCard voc={mediumVoc} />);

    const badge = screen.getByText('45%');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
  });

  it('applies correct similarity color for low similarity (<40%)', () => {
    const lowVoc = { ...mockSimilarVoc, similarity: 0.25 };
    render(<SimilarVocCard voc={lowVoc} />);

    const badge = screen.getByText('25%');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('displays formatted creation date', () => {
    render(<SimilarVocCard voc={mockSimilarVoc} />);

    expect(screen.getByText('2026. 01. 23.')).toBeInTheDocument();
  });

  it('does not call onClick when handler is not provided', async () => {
    const user = userEvent.setup();

    render(<SimilarVocCard voc={mockSimilarVoc} />);

    const card = screen.getByRole('button', { name: /유사 VOC VOC-20260123-00002/i });
    await user.click(card);

    // Should not throw error
    expect(card).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SimilarVocCard voc={mockSimilarVoc} className="custom-class" />);

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });
});
