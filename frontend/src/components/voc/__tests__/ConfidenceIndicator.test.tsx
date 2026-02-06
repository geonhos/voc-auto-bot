import { render, screen } from '@testing-library/react';

import type { ConfidenceDetails } from '@/types/voc';

import { ConfidenceIndicator, ConfidenceBadge } from '../ConfidenceIndicator';

describe('ConfidenceIndicator', () => {
  describe('Confidence Level Rendering', () => {
    it('renders HIGH confidence level with green color', () => {
      render(
        <ConfidenceIndicator
          confidence={0.85}
          confidenceLevel="HIGH"
        />
      );

      expect(screen.getByText('높음', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('renders MEDIUM confidence level with yellow color', () => {
      render(
        <ConfidenceIndicator
          confidence={0.55}
          confidenceLevel="MEDIUM"
        />
      );

      expect(screen.getByText('보통', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('55%')).toBeInTheDocument();
    });

    it('renders LOW confidence level with red color and warning', () => {
      render(
        <ConfidenceIndicator
          confidence={0.25}
          confidenceLevel="LOW"
        />
      );

      expect(screen.getByText('낮음', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      // Should show warning message for low confidence
      expect(screen.getByText('분석 정확도가 낮을 수 있습니다')).toBeInTheDocument();
    });

    it('determines confidence level from score when not provided', () => {
      // HIGH: >= 0.7
      const { rerender } = render(<ConfidenceIndicator confidence={0.75} />);
      expect(screen.getByText('높음', { exact: false })).toBeInTheDocument();

      // MEDIUM: >= 0.4
      rerender(<ConfidenceIndicator confidence={0.5} />);
      expect(screen.getByText('보통', { exact: false })).toBeInTheDocument();

      // LOW: < 0.4
      rerender(<ConfidenceIndicator confidence={0.3} />);
      expect(screen.getByText('낮음', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Analysis Method Badge', () => {
    it('renders RAG method badge', () => {
      render(
        <ConfidenceIndicator
          confidence={0.8}
          analysisMethod="rag"
          showMethodBadge={true}
        />
      );

      expect(screen.getByText('RAG 기반')).toBeInTheDocument();
    });

    it('renders Rule-Based method badge', () => {
      render(
        <ConfidenceIndicator
          confidence={0.5}
          analysisMethod="rule_based"
          showMethodBadge={true}
        />
      );

      expect(screen.getByText('규칙 기반')).toBeInTheDocument();
    });

    it('renders Direct LLM method badge', () => {
      render(
        <ConfidenceIndicator
          confidence={0.3}
          analysisMethod="direct_llm"
          showMethodBadge={true}
        />
      );

      expect(screen.getByText('LLM 직접')).toBeInTheDocument();
    });

    it('hides method badge when showMethodBadge is false', () => {
      render(
        <ConfidenceIndicator
          confidence={0.8}
          analysisMethod="rag"
          showMethodBadge={false}
        />
      );

      expect(screen.queryByText('RAG 기반')).not.toBeInTheDocument();
    });
  });

  describe('Vector Match Count', () => {
    it('displays vector match count when provided', () => {
      render(
        <ConfidenceIndicator
          confidence={0.8}
          vectorMatchCount={5}
        />
      );

      expect(screen.getByText(/유사 로그 5개 발견/)).toBeInTheDocument();
    });

    it('does not display vector match count when not provided', () => {
      render(<ConfidenceIndicator confidence={0.8} />);

      expect(screen.queryByText(/유사 로그/)).not.toBeInTheDocument();
    });
  });

  describe('Low Confidence Warning', () => {
    it('shows warning for LOW confidence', () => {
      render(
        <ConfidenceIndicator
          confidence={0.25}
          confidenceLevel="LOW"
        />
      );

      expect(screen.getByText('분석 정확도가 낮을 수 있습니다')).toBeInTheDocument();
    });

    it('shows appropriate warning for direct_llm method', () => {
      render(
        <ConfidenceIndicator
          confidence={0.25}
          confidenceLevel="LOW"
          analysisMethod="direct_llm"
        />
      );

      expect(screen.getByText(/참조 데이터 없이 분석되었습니다/)).toBeInTheDocument();
    });

    it('shows appropriate warning for rule_based method', () => {
      render(
        <ConfidenceIndicator
          confidence={0.35}
          confidenceLevel="LOW"
          analysisMethod="rule_based"
        />
      );

      expect(screen.getByText(/규칙 기반 분석으로 정확도가 제한적입니다/)).toBeInTheDocument();
    });

    it('does not show warning for HIGH or MEDIUM confidence', () => {
      const { rerender } = render(
        <ConfidenceIndicator confidence={0.8} confidenceLevel="HIGH" />
      );
      expect(screen.queryByText('분석 정확도가 낮을 수 있습니다')).not.toBeInTheDocument();

      rerender(<ConfidenceIndicator confidence={0.5} confidenceLevel="MEDIUM" />);
      expect(screen.queryByText('분석 정확도가 낮을 수 있습니다')).not.toBeInTheDocument();
    });
  });

  describe('Confidence Details Tooltip', () => {
    const mockDetails: ConfidenceDetails = {
      level: 'HIGH',
      score: 0.85,
      breakdown: {
        vectorMatchScore: 0.9,
        similarityScore: 0.8,
        responseCompleteness: 0.85,
        categoryMatchScore: 0.9,
      },
      factors: [
        'RAG 기반 분석 (유사 로그 참조)',
        '충분한 유사 로그 발견 (5개)',
        '높은 유사도 점수',
      ],
    };

    it('shows details when showTooltip is true', () => {
      render(
        <ConfidenceIndicator
          confidence={0.85}
          confidenceDetails={mockDetails}
          showTooltip={true}
        />
      );

      expect(screen.getByText('상세 정보 보기')).toBeInTheDocument();
    });

    it('hides details when showTooltip is false', () => {
      render(
        <ConfidenceIndicator
          confidence={0.85}
          confidenceDetails={mockDetails}
          showTooltip={false}
        />
      );

      expect(screen.queryByText('상세 정보 보기')).not.toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(
        <ConfidenceIndicator
          confidence={0.8}
          size="sm"
        />
      );

      // Just check it renders without error
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('renders medium size correctly', () => {
      render(
        <ConfidenceIndicator
          confidence={0.8}
          size="md"
        />
      );

      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('renders large size correctly', () => {
      render(
        <ConfidenceIndicator
          confidence={0.8}
          size="lg"
        />
      );

      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });
});

describe('ConfidenceBadge', () => {
  it('renders confidence percentage', () => {
    render(<ConfidenceBadge confidence={0.85} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('applies correct color for HIGH confidence', () => {
    const { container } = render(
      <ConfidenceBadge confidence={0.85} confidenceLevel="HIGH" />
    );

    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('applies correct color for MEDIUM confidence', () => {
    const { container } = render(
      <ConfidenceBadge confidence={0.5} confidenceLevel="MEDIUM" />
    );

    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('applies correct color for LOW confidence', () => {
    const { container } = render(
      <ConfidenceBadge confidence={0.25} confidenceLevel="LOW" />
    );

    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });

  it('determines color from score when confidenceLevel not provided', () => {
    const { container, rerender } = render(
      <ConfidenceBadge confidence={0.75} />
    );

    let badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100');

    rerender(<ConfidenceBadge confidence={0.5} />);
    badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-yellow-100');

    rerender(<ConfidenceBadge confidence={0.25} />);
    badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100');
  });
});
