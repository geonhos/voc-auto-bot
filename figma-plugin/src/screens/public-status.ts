import { COLORS, RADIUS, SCREEN_WIDTH } from '../utils/constants';
import { createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';
import { buildButton, buildInput, buildBadge } from '../design-system/components';

export async function generatePublicStatus(): Promise<FrameNode[]> {

  const root = createAutoLayoutFrame({
    name: 'Public Status',
    direction: 'VERTICAL',
    width: SCREEN_WIDTH,
    height: 900,
    fill: COLORS.bgLight,
  });
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';

  // Container
  const container = createAutoLayoutFrame({
    name: 'Container',
    direction: 'VERTICAL',
    width: 600,
    padding: 40,
    gap: 32,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  container.counterAxisAlignItems = 'CENTER';

  // Header
  const header = createAutoLayoutFrame({ name: 'Header', direction: 'VERTICAL', gap: 8 });
  header.counterAxisAlignItems = 'CENTER';
  header.appendChild(createText({ text: 'VOC 처리 현황 조회', size: 24, weight: 700 }));
  header.appendChild(createText({ text: '접수번호를 입력하여 처리 상태를 확인하세요', size: 14, color: COLORS.textSecondary }));
  container.appendChild(header);

  // Search form
  const searchForm = createAutoLayoutFrame({
    name: 'Search Form',
    direction: 'HORIZONTAL',
    gap: 12,
    width: 'FILL',
  });
  searchForm.counterAxisAlignItems = 'MAX';
  searchForm.appendChild(buildInput('접수번호', 'VOC-XXXX-XXXX', 380));
  searchForm.appendChild(buildButton('조회', 'primary'));
  container.appendChild(searchForm);

  // Divider
  const divider = createAutoLayoutFrame({ name: 'Divider', direction: 'HORIZONTAL', width: 'FILL', height: 1, fill: COLORS.borderLight });
  container.appendChild(divider);

  // Result card
  const result = createAutoLayoutFrame({
    name: 'Result',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 24,
    gap: 16,
    fill: COLORS.bgLight,
    cornerRadius: RADIUS.md,
  });

  // Status row
  const statusRow = createAutoLayoutFrame({ name: 'Status Row', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  statusRow.counterAxisAlignItems = 'CENTER';
  statusRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  statusRow.appendChild(createText({ text: 'VOC-2025-0001', size: 16, weight: 600 }));
  statusRow.appendChild(buildBadge('처리중', '#f0e8d9', '#7d6333'));
  result.appendChild(statusRow);

  // Info rows
  const infoItems = [
    ['제목', '로그인 오류 반복 발생'],
    ['카테고리', '시스템 오류 > 인증'],
    ['접수일', '2025-01-15 14:30'],
    ['예상 완료', '2025-01-20'],
  ];

  for (const [label, value] of infoItems) {
    const row = createAutoLayoutFrame({ name: label, direction: 'HORIZONTAL', gap: 16, width: 'FILL' });
    row.appendChild(createText({ text: label, size: 13, weight: 500, color: COLORS.textSecondary, width: 100 }));
    row.appendChild(createText({ text: value, size: 13, width: 'FILL' }));
    result.appendChild(row);
  }

  // Progress steps
  const progress = createAutoLayoutFrame({ name: 'Progress', direction: 'HORIZONTAL', gap: 4, width: 'FILL' });
  const steps = ['접수', '분석', '처리중', '완료'];
  const currentStep = 2;
  for (let i = 0; i < steps.length; i++) {
    const step = createAutoLayoutFrame({
      name: steps[i],
      direction: 'VERTICAL',
      gap: 4,
      width: 'FILL',
    });
    step.counterAxisAlignItems = 'CENTER';

    const dot = createPlaceholder('Dot', 24, 24, i <= currentStep ? COLORS.primary : COLORS.borderLight);
    dot.cornerRadius = 9999;
    step.appendChild(dot);
    step.appendChild(createText({ text: steps[i], size: 11, weight: i <= currentStep ? 600 : 400, color: i <= currentStep ? COLORS.primary : COLORS.textMuted }));
    progress.appendChild(step);
  }
  result.appendChild(progress);

  container.appendChild(result);
  root.appendChild(container);
  finalize(root);
  return [root];
}
