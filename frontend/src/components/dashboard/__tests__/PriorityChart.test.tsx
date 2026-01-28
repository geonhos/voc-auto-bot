import { render, screen } from '@testing-library/react';

import type { PriorityStats } from '@/types/statistics';

import { PriorityChart } from '../PriorityChart';

const mockPriorityData: PriorityStats[] = [
  {
    priority: 'URGENT',
    priorityLabel: '긴급',
    count: 25,
    percentage: 10.5,
  },
  {
    priority: 'HIGH',
    priorityLabel: '높음',
    count: 80,
    percentage: 33.6,
  },
  {
    priority: 'NORMAL',
    priorityLabel: '보통',
    count: 100,
    percentage: 42.0,
  },
  {
    priority: 'LOW',
    priorityLabel: '낮음',
    count: 33,
    percentage: 13.9,
  },
];

describe('PriorityChart', () => {
  it('renders loading state', () => {
    render(<PriorityChart data={[]} isLoading={true} />);

    const skeletons = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no data', () => {
    render(<PriorityChart data={[]} />);

    expect(screen.getByText('우선순위별 분포')).toBeInTheDocument();
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
  });

  it('renders chart title', () => {
    render(<PriorityChart data={mockPriorityData} />);

    expect(screen.getByText('우선순위별 분포')).toBeInTheDocument();
  });

  it('renders with valid priority data', () => {
    const { container } = render(<PriorityChart data={mockPriorityData} />);

    // Verify chart title is rendered
    expect(screen.getByText('우선순위별 분포')).toBeInTheDocument();

    // Verify ResponsiveContainer is rendered (Recharts may not render children in jsdom)
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();

    // Verify no empty state is shown
    expect(screen.queryByText('데이터가 없습니다')).not.toBeInTheDocument();
  });
});
