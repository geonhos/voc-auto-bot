import { render, screen } from '@testing-library/react';
import { BarChart3Icon } from 'lucide-react';

import { KpiCard } from '../KpiCard';

describe('KpiCard', () => {
  it('renders title and value correctly', () => {
    render(
      <KpiCard
        title="총 접수 건수"
        value="1,234건"
        icon={<BarChart3Icon data-testid="icon" />}
      />
    );

    expect(screen.getByText('총 접수 건수')).toBeInTheDocument();
    expect(screen.getByText('1,234건')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('displays increase change correctly', () => {
    render(
      <KpiCard
        title="총 접수 건수"
        value="1,234건"
        icon={<BarChart3Icon />}
        change={{ value: 12, type: 'increase', label: '전 기간 대비 12% 증가' }}
      />
    );

    expect(screen.getByText('+12%')).toBeInTheDocument();
    const changeElement = screen.getByText('+12%').closest('p');
    expect(changeElement).toHaveClass('text-info');
  });

  it('displays decrease change correctly', () => {
    render(
      <KpiCard
        title="평균 처리 시간"
        value="5.2시간"
        icon={<BarChart3Icon />}
        change={{ value: 5, type: 'decrease', label: '전 기간 대비 5% 감소' }}
      />
    );

    expect(screen.getByText('5%')).toBeInTheDocument();
    const changeElement = screen.getByText('5%').closest('p');
    expect(changeElement).toHaveClass('text-success');
  });

  it('displays neutral change correctly', () => {
    render(
      <KpiCard
        title="처리 중"
        value="45건"
        icon={<BarChart3Icon />}
        change={{ value: 2.5, type: 'neutral', label: '전체 VOC의 2.5%' }}
      />
    );

    expect(screen.getByText('2.5%')).toBeInTheDocument();
    const changeElement = screen.getByText('2.5%').closest('p');
    expect(changeElement).toHaveClass('text-slate-500');
  });

  it('renders without change indicator', () => {
    render(
      <KpiCard
        title="총 접수 건수"
        value="1,234건"
        icon={<BarChart3Icon />}
      />
    );

    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('has accessible region with title', () => {
    render(
      <KpiCard
        title="총 접수 건수"
        value="1,234건"
        icon={<BarChart3Icon />}
      />
    );

    const region = screen.getByRole('region', { name: '총 접수 건수' });
    expect(region).toBeInTheDocument();
  });
});
