import { render, screen } from '@testing-library/react';
import { RecentVocList } from '../RecentVocList';
import type { Voc } from '@/types/voc';

const mockVocs: Voc[] = [
  {
    id: 1,
    ticketId: 'VOC-2024-001',
    title: '제품 불량 문의',
    content: '제품에 결함이 있습니다',
    status: 'RECEIVED',
    priority: 'HIGH',
    channel: 'EMAIL',
    customerName: '홍길동',
    customerEmail: 'hong@example.com',
    category: { id: 1, name: '제품 문의', code: 'PRODUCT' },
    attachments: [],
    memos: [],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    ticketId: 'VOC-2024-002',
    title: '배송 지연 문의',
    content: '배송이 늦어지고 있습니다',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    channel: 'PHONE',
    customerName: '김철수',
    customerEmail: 'kim@example.com',
    category: { id: 2, name: '배송 문의', code: 'DELIVERY' },
    attachments: [],
    memos: [],
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
];

describe('RecentVocList', () => {
  it('renders loading state', () => {
    render(<RecentVocList data={[]} isLoading={true} />);

    const skeletons = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-pulse')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no data', () => {
    render(<RecentVocList data={[]} />);

    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
  });

  it('renders VOC list with all items', () => {
    render(<RecentVocList data={mockVocs} />);

    expect(screen.getByText('제품 불량 문의')).toBeInTheDocument();
    expect(screen.getByText('배송 지연 문의')).toBeInTheDocument();
    expect(screen.getByText('VOC-2024-001')).toBeInTheDocument();
    expect(screen.getByText('VOC-2024-002')).toBeInTheDocument();
  });

  it('limits items based on maxItems prop', () => {
    render(<RecentVocList data={mockVocs} maxItems={1} />);

    expect(screen.getByText('제품 불량 문의')).toBeInTheDocument();
    expect(screen.queryByText('배송 지연 문의')).not.toBeInTheDocument();
  });

  it('displays customer names', () => {
    render(<RecentVocList data={mockVocs} />);

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('김철수')).toBeInTheDocument();
  });

  it('displays categories', () => {
    render(<RecentVocList data={mockVocs} />);

    expect(screen.getByText('제품 문의')).toBeInTheDocument();
    expect(screen.getByText('배송 문의')).toBeInTheDocument();
  });

  it('renders links to VOC details', () => {
    render(<RecentVocList data={mockVocs} />);

    const links = screen.getAllByRole('link').filter((link) =>
      link.getAttribute('href')?.startsWith('/voc/')
    );
    expect(links.length).toBeGreaterThan(0);
  });

  it('shows "더 보기" link when items exceed maxItems', () => {
    const manyVocs = Array.from({ length: 15 }, (_, i) => ({
      ...mockVocs[0],
      id: i + 1,
      ticketId: `VOC-2024-${String(i + 1).padStart(3, '0')}`,
    }));

    render(<RecentVocList data={manyVocs} maxItems={10} />);

    expect(screen.getByText(/더 보기 \(5건\)/)).toBeInTheDocument();
  });

  it('has accessible link to view all VOCs', () => {
    render(<RecentVocList data={mockVocs} />);

    const viewAllLink = screen.getByRole('link', { name: '전체 VOC 목록 보기' });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute('href', '/voc/table');
  });
});
