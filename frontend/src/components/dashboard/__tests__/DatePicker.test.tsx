import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DatePicker } from '../DatePicker';

describe('DatePicker', () => {
  const mockOnApply = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders date picker popup when open', () => {
    render(
      <DatePicker
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
      />
    );

    expect(screen.getByText('날짜 범위 선택')).toBeInTheDocument();
    expect(screen.getByLabelText('시작일')).toBeInTheDocument();
    expect(screen.getByLabelText('종료일')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DatePicker
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
      />
    );

    expect(screen.queryByText('날짜 범위 선택')).not.toBeInTheDocument();
  });

  it('calls onApply with selected dates when apply button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
      />
    );

    const startDateInput = screen.getByLabelText('시작일');
    const endDateInput = screen.getByLabelText('종료일');

    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-01-31');

    await user.click(screen.getByText('적용'));

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error when start date is after end date', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
      />
    );

    const startDateInput = screen.getByLabelText('시작일');
    const endDateInput = screen.getByLabelText('종료일');

    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-31');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-01-01');

    await user.click(screen.getByText('적용'));

    expect(screen.getByText('시작일은 종료일보다 이전이어야 합니다.')).toBeInTheDocument();
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it('shows error when date range exceeds 90 days', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
      />
    );

    const startDateInput = screen.getByLabelText('시작일');
    const endDateInput = screen.getByLabelText('종료일');

    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2024-05-01'); // More than 90 days

    await user.click(screen.getByText('적용'));

    expect(screen.getByText('최대 90일까지 조회 가능합니다.')).toBeInTheDocument();
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it('closes popup when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
      />
    );

    await user.click(screen.getByText('취소'));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it('initializes with provided initial dates', () => {
    render(
      <DatePicker
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        onApply={mockOnApply}
        initialStartDate="2024-01-01"
        initialEndDate="2024-01-31"
      />
    );

    const startDateInput = screen.getByLabelText('시작일') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('종료일') as HTMLInputElement;

    expect(startDateInput.value).toBe('2024-01-01');
    expect(endDateInput.value).toBe('2024-01-31');
  });
});
