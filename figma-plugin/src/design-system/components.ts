import { COLORS, STATUS_COLORS, PRIORITY_COLORS, RADIUS, SPACING } from '../utils/constants';
import { solidPaint, createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';

/** Visual component showcase page */
export async function generateComponents(): Promise<FrameNode[]> {
  const root = createAutoLayoutFrame({
    name: 'Component Library',
    direction: 'VERTICAL',
    padding: 48,
    gap: 48,
  });

  root.appendChild(createText({ text: 'Component Library', size: 30, weight: 700 }));

  // ── Buttons ───────────────────────────────────────────────────────
  const btnSection = createAutoLayoutFrame({ name: 'Buttons', direction: 'VERTICAL', gap: 16 });
  btnSection.appendChild(createText({ text: 'Buttons', size: 20, weight: 600 }));

  const btnRow = createAutoLayoutFrame({ name: 'Button Row', direction: 'HORIZONTAL', gap: 12 });
  btnRow.appendChild(buildButton('Primary Button', 'primary'));
  btnRow.appendChild(buildButton('Secondary Button', 'secondary'));
  btnRow.appendChild(buildButton('Danger Button', 'danger'));
  btnRow.appendChild(buildButton('Ghost Button', 'ghost'));
  btnSection.appendChild(btnRow);
  root.appendChild(btnSection);

  // ── Badges ────────────────────────────────────────────────────────
  const badgeSection = createAutoLayoutFrame({ name: 'Badges', direction: 'VERTICAL', gap: 16 });
  badgeSection.appendChild(createText({ text: 'Status Badges', size: 20, weight: 600 }));

  const badgeRow = createAutoLayoutFrame({ name: 'Badge Row', direction: 'HORIZONTAL', gap: 12 });
  for (const [status, colors] of Object.entries(STATUS_COLORS)) {
    badgeRow.appendChild(buildBadge(status.toUpperCase(), colors.bg, colors.text));
  }
  badgeSection.appendChild(badgeRow);

  const priorityBadgeRow = createAutoLayoutFrame({ name: 'Priority Badge Row', direction: 'HORIZONTAL', gap: 12 });
  for (const [priority, hex] of Object.entries(PRIORITY_COLORS)) {
    priorityBadgeRow.appendChild(buildBadge(priority, hex, '#ffffff'));
  }
  badgeSection.appendChild(priorityBadgeRow);
  root.appendChild(badgeSection);

  // ── Form Controls ─────────────────────────────────────────────────
  const formSection = createAutoLayoutFrame({ name: 'Form Controls', direction: 'VERTICAL', gap: 16 });
  formSection.appendChild(createText({ text: 'Form Controls', size: 20, weight: 600 }));

  const formRow = createAutoLayoutFrame({ name: 'Form Row', direction: 'HORIZONTAL', gap: 24 });
  formRow.appendChild(buildInput('Text Input', '입력하세요...', 240));
  formRow.appendChild(buildSelect('Select', '선택하세요', 200));
  formRow.appendChild(buildTextarea('Textarea', '내용을 입력하세요...', 280, 100));
  formSection.appendChild(formRow);
  root.appendChild(formSection);

  // ── Cards ─────────────────────────────────────────────────────────
  const cardSection = createAutoLayoutFrame({ name: 'Cards', direction: 'VERTICAL', gap: 16 });
  cardSection.appendChild(createText({ text: 'Cards', size: 20, weight: 600 }));

  const cardRow = createAutoLayoutFrame({ name: 'Card Row', direction: 'HORIZONTAL', gap: 24 });
  cardRow.appendChild(buildCard('KPI Card', '접수된 VOC', '1,234', '+12.5%'));
  cardRow.appendChild(buildCard('KPI Card', '처리 중', '56', '-3.2%'));
  cardRow.appendChild(buildCard('KPI Card', '완료율', '89.2%', '+5.1%'));
  cardSection.appendChild(cardRow);
  root.appendChild(cardSection);

  // ── Table ─────────────────────────────────────────────────────────
  const tableSection = createAutoLayoutFrame({ name: 'Table', direction: 'VERTICAL', gap: 16 });
  tableSection.appendChild(createText({ text: 'Table', size: 20, weight: 600 }));

  const table = createAutoLayoutFrame({
    name: 'Sample Table',
    direction: 'VERTICAL',
    width: 800,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  table.appendChild(buildTableHeader(['ID', '제목', '상태', '우선순위', '등록일'], [60, 300, 100, 100, 120]));
  table.appendChild(buildTableRow(['VOC-001', '로그인 오류 반복 발생', 'RECEIVED', 'HIGH', '2025-01-15'], [60, 300, 100, 100, 120]));
  table.appendChild(buildTableRow(['VOC-002', '결제 화면 느려짐', 'PROCESSING', 'URGENT', '2025-01-14'], [60, 300, 100, 100, 120]));
  table.appendChild(buildTableRow(['VOC-003', '앱 업데이트 후 크래시', 'COMPLETED', 'NORMAL', '2025-01-13'], [60, 300, 100, 100, 120]));
  tableSection.appendChild(table);
  root.appendChild(tableSection);

  finalize(root);
  return [root];
}

// ── Component Builder Functions (exported for screen reuse) ─────────

export function buildButton(label: string, variant: 'primary' | 'secondary' | 'danger' | 'ghost'): FrameNode {
  const colorMap = {
    primary:   { bg: COLORS.primary, text: COLORS.textOnPrimary },
    secondary: { bg: COLORS.bgLight, text: COLORS.textPrimary },
    danger:    { bg: COLORS.danger, text: '#ffffff' },
    ghost:     { bg: 'transparent', text: COLORS.primary },
  };
  const c = colorMap[variant];

  const btn = createAutoLayoutFrame({
    name: label,
    direction: 'HORIZONTAL',
    padding: { top: 8, right: 16, bottom: 8, left: 16 },
    gap: 8,
    fill: c.bg === 'transparent' ? undefined : c.bg,
    cornerRadius: RADIUS.md,
    stroke: variant === 'ghost' ? COLORS.borderLight : undefined,
  });
  btn.counterAxisAlignItems = 'CENTER';
  btn.appendChild(createText({ text: label, size: 14, weight: 500, color: c.text }));
  return btn;
}

export function buildBadge(label: string, bg: string, textColor: string): FrameNode {
  const badge = createAutoLayoutFrame({
    name: `Badge - ${label}`,
    direction: 'HORIZONTAL',
    padding: { top: 4, right: 12, bottom: 4, left: 12 },
    fill: bg,
    cornerRadius: 9999,
  });
  badge.appendChild(createText({ text: label, size: 12, weight: 600, color: textColor }));
  return badge;
}

export function buildInput(label: string, placeholder: string, width: number): FrameNode {
  const wrapper = createAutoLayoutFrame({ name: label, direction: 'VERTICAL', gap: 6, width });
  wrapper.appendChild(createText({ text: label, size: 13, weight: 500 }));

  const input = createAutoLayoutFrame({
    name: 'Input',
    direction: 'HORIZONTAL',
    width: 'FILL',
    height: 36,
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.md,
    stroke: COLORS.borderLight,
  });
  input.counterAxisAlignItems = 'CENTER';
  input.appendChild(createText({ text: placeholder, size: 14, color: COLORS.textMuted }));
  wrapper.appendChild(input);
  return wrapper;
}

export function buildSelect(label: string, placeholder: string, width: number): FrameNode {
  const wrapper = createAutoLayoutFrame({ name: label, direction: 'VERTICAL', gap: 6, width });
  wrapper.appendChild(createText({ text: label, size: 13, weight: 500 }));

  const select = createAutoLayoutFrame({
    name: 'Select',
    direction: 'HORIZONTAL',
    width: 'FILL',
    height: 36,
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.md,
    stroke: COLORS.borderLight,
  });
  select.counterAxisAlignItems = 'CENTER';
  select.primaryAxisAlignItems = 'SPACE_BETWEEN';
  select.appendChild(createText({ text: placeholder, size: 14, color: COLORS.textMuted }));
  select.appendChild(createText({ text: '▾', size: 14, color: COLORS.textSecondary }));
  wrapper.appendChild(select);
  return wrapper;
}

export function buildTextarea(label: string, placeholder: string, width: number, height: number): FrameNode {
  const wrapper = createAutoLayoutFrame({ name: label, direction: 'VERTICAL', gap: 6, width });
  wrapper.appendChild(createText({ text: label, size: 13, weight: 500 }));

  const textarea = createAutoLayoutFrame({
    name: 'Textarea',
    direction: 'VERTICAL',
    width: 'FILL',
    height,
    padding: 12,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.md,
    stroke: COLORS.borderLight,
  });
  textarea.appendChild(createText({ text: placeholder, size: 14, color: COLORS.textMuted, width: 'FILL' }));
  wrapper.appendChild(textarea);
  return wrapper;
}

export function buildCard(name: string, title: string, value: string, change: string): FrameNode {
  const card = createAutoLayoutFrame({
    name,
    direction: 'VERTICAL',
    padding: 20,
    gap: 8,
    width: 200,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  card.appendChild(createText({ text: title, size: 13, weight: 500, color: COLORS.textSecondary }));
  card.appendChild(createText({ text: value, size: 28, weight: 700 }));

  const isPositive = change.startsWith('+');
  card.appendChild(createText({
    text: change,
    size: 12,
    weight: 500,
    color: isPositive ? COLORS.success : COLORS.danger,
  }));

  return card;
}

export function buildTableHeader(columns: string[], widths: number[]): FrameNode {
  const row = createAutoLayoutFrame({
    name: 'Table Header',
    direction: 'HORIZONTAL',
    width: 'FILL',
    padding: { top: 10, right: 16, bottom: 10, left: 16 },
    fill: COLORS.bgLight,
  });

  for (let i = 0; i < columns.length; i++) {
    const cell = createAutoLayoutFrame({ name: columns[i], direction: 'HORIZONTAL', width: widths[i] });
    cell.appendChild(createText({ text: columns[i], size: 12, weight: 600, color: COLORS.textSecondary }));
    row.appendChild(cell);
  }

  return row;
}

export function buildTableRow(cells: string[], widths: number[]): FrameNode {
  const row = createAutoLayoutFrame({
    name: 'Table Row',
    direction: 'HORIZONTAL',
    width: 'FILL',
    padding: { top: 12, right: 16, bottom: 12, left: 16 },
    stroke: COLORS.borderLight,
  });

  for (let i = 0; i < cells.length; i++) {
    const cell = createAutoLayoutFrame({ name: `Cell ${i}`, direction: 'HORIZONTAL', width: widths[i] });
    cell.appendChild(createText({ text: cells[i], size: 13 }));
    row.appendChild(cell);
  }

  return row;
}
