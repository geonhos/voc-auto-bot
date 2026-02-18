import { COLORS, PRIORITY_COLORS, RADIUS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, finalize, markFillH, solidPaint } from '../utils/helpers';
import { buildBadge, buildButton, buildInput, buildSelect, buildTextarea } from '../design-system/components';

// ── Category Card Colors ────────────────────────────────────────────

const CATEGORY_CARDS = [
  { label: '오류/버그',     desc: '시스템 오류 및 버그', icon: '🐛', border: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
  { label: '기능 요청',     desc: '새 기능 및 개선',     icon: '💡', border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
  { label: '문의',          desc: '사용법, 정책 등',     icon: '❓', border: '#22c55e', bg: '#f0fdf4', text: '#15803d' },
  { label: '불만/컴플레인', desc: '서비스 불만 및 민원', icon: '⚠️', border: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
  { label: '칭찬/감사',     desc: '만족 및 감사 피드백', icon: '👍', border: '#a855f7', bg: '#faf5ff', text: '#7e22ce' },
] as const;

export async function generateVocInput(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('VOC 입력');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: 'VOC 등록', size: 24, weight: 700 }));
  content.appendChild(pageHeader);

  // Form card
  const card = createAutoLayoutFrame({
    name: 'Form Card',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 24,
    gap: 20,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  // ── ① 고객 이메일 (게이트 필드 — 최상단) ──────────────────────────
  const emailInput = buildInput('고객 이메일 *', 'customer@example.com', 600);
  markFillH(emailInput);
  card.appendChild(emailInput);

  // ── ② 고객 VOC 이력 배너 ──────────────────────────────────────────
  const banner = createAutoLayoutFrame({
    name: 'Customer VOC History Banner',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 16,
    gap: 8,
    fill: '#fffbeb',
    cornerRadius: RADIUS.md,
    stroke: '#fcd34d',
  });
  // Banner header
  const bannerHeader = createAutoLayoutFrame({ name: 'Banner Header', direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
  bannerHeader.counterAxisAlignItems = 'CENTER';
  bannerHeader.appendChild(createText({ text: '⚠', size: 16, color: '#d97706' }));
  const bannerTextCol = createAutoLayoutFrame({ name: 'Banner Text', direction: 'VERTICAL', gap: 2 });
  bannerTextCol.appendChild(createText({ text: '이 고객의 미해결 VOC가 2건 있습니다', size: 13, weight: 600, color: '#92400e' }));
  bannerTextCol.appendChild(createText({ text: '중복 접수 여부를 확인해 주세요.', size: 12, color: '#b45309' }));
  bannerHeader.appendChild(bannerTextCol);
  banner.appendChild(bannerHeader);
  // Banner items
  const item1 = createAutoLayoutFrame({ name: 'VOC Item 1', direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
  item1.counterAxisAlignItems = 'CENTER';
  item1.appendChild(createText({ text: 'VOC-20260218-001', size: 11, weight: 500, color: '#92400e' }));
  item1.appendChild(buildBadge('NEW', '#e7e5e4', '#44403c'));
  item1.appendChild(buildBadge('HIGH', PRIORITY_COLORS.HIGH, '#ffffff'));
  item1.appendChild(createText({ text: '결제 오류가 발생하고 있습니다', size: 11, color: '#374151' }));
  banner.appendChild(item1);
  card.appendChild(banner);

  // ── ③ 고객명 ──────────────────────────────────────────────────────
  const nameInput = buildInput('고객명', '고객명을 입력하세요', 600);
  markFillH(nameInput);
  card.appendChild(nameInput);

  // ── ④ 제목 ────────────────────────────────────────────────────────
  const titleInput = buildInput('제목 *', 'VOC 제목을 입력하세요 (2~200자)', 600);
  markFillH(titleInput);
  card.appendChild(titleInput);

  // ── ⑤ 내용 ────────────────────────────────────────────────────────
  const contentArea = buildTextarea('내용 *', '내용을 입력하세요 (최소 10자)', 600, 160);
  markFillH(contentArea);
  card.appendChild(contentArea);

  // Character count
  const charCount = createAutoLayoutFrame({ name: 'Char Count', direction: 'HORIZONTAL', width: 'FILL' });
  charCount.primaryAxisAlignItems = 'MAX';
  charCount.appendChild(createText({ text: '0/5000', size: 12, color: COLORS.textMuted }));
  card.appendChild(charCount);

  // ── ⑥ 카테고리 카드 (5대 대분류) ──────────────────────────────────
  const catLabel = createText({ text: '카테고리 *', size: 13, weight: 500 });
  card.appendChild(catLabel);

  const cardGrid = createAutoLayoutFrame({
    name: 'Category Card Grid',
    direction: 'HORIZONTAL',
    gap: 12,
    width: 'FILL',
  });
  cardGrid.layoutWrap = 'WRAP';

  for (let i = 0; i < CATEGORY_CARDS.length; i++) {
    const meta = CATEGORY_CARDS[i];
    const isSelected = i === 0; // First card selected for demo

    const catCard = createAutoLayoutFrame({
      name: `Card - ${meta.label}`,
      direction: 'VERTICAL',
      width: 140,
      padding: 16,
      gap: 8,
      fill: isSelected ? meta.bg : COLORS.surfaceLight,
      cornerRadius: RADIUS.lg,
      stroke: isSelected ? meta.border : COLORS.borderLight,
    });
    catCard.counterAxisAlignItems = 'CENTER';
    if (isSelected) {
      catCard.strokes = [{ type: 'SOLID', color: solidPaint(meta.border).color }];
      catCard.strokeWeight = 2;
    }

    catCard.appendChild(createText({ text: meta.icon, size: 24 }));
    catCard.appendChild(createText({
      text: meta.label,
      size: 13,
      weight: 600,
      color: isSelected ? meta.text : COLORS.textPrimary,
    }));
    catCard.appendChild(createText({
      text: meta.desc,
      size: 11,
      color: isSelected ? meta.text : COLORS.textSecondary,
    }));

    cardGrid.appendChild(catCard);
  }
  card.appendChild(cardGrid);

  // Sub-category dropdown (progressive disclosure)
  const subCat = buildSelect('중분류 *', '중분류를 선택하세요', 300);
  markFillH(subCat);
  card.appendChild(subCat);

  // ── ⑦ 우선순위 + 추천 뱃지 ────────────────────────────────────────
  const priorityRow = createAutoLayoutFrame({ name: 'Priority Section', direction: 'VERTICAL', gap: 6, width: 'FILL' });
  const priSelect = buildSelect('우선순위 *', 'HIGH', 300);
  markFillH(priSelect);
  priorityRow.appendChild(priSelect);

  // Recommendation badge
  const recBadge = createAutoLayoutFrame({
    name: 'Priority Recommendation',
    direction: 'HORIZONTAL',
    gap: 8,
  });
  recBadge.counterAxisAlignItems = 'CENTER';
  recBadge.appendChild(buildBadge('추천: 높음', PRIORITY_COLORS.HIGH, '#ffffff'));
  priorityRow.appendChild(recBadge);
  card.appendChild(priorityRow);

  // ── ⑧ 파일 첨부 영역 ──────────────────────────────────────────────
  const fileSep = createAutoLayoutFrame({ name: 'File Separator', direction: 'HORIZONTAL', width: 'FILL', height: 1, fill: COLORS.borderLight });
  card.appendChild(fileSep);

  const fileArea = createAutoLayoutFrame({
    name: 'File Upload',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 24,
    gap: 8,
    fill: '#f9fafb',
    cornerRadius: RADIUS.md,
    stroke: COLORS.borderLight,
  });
  fileArea.counterAxisAlignItems = 'CENTER';
  fileArea.appendChild(createText({ text: '📎 파일을 드래그하거나 클릭하여 업로드', size: 13, color: COLORS.textSecondary }));
  fileArea.appendChild(createText({ text: '최대 5개, 각 10MB 이하', size: 11, color: COLORS.textMuted }));
  card.appendChild(fileArea);

  // ── ⑨ 하단 액션 ───────────────────────────────────────────────────
  const actionSep = createAutoLayoutFrame({ name: 'Action Separator', direction: 'HORIZONTAL', width: 'FILL', height: 1, fill: COLORS.borderLight });
  card.appendChild(actionSep);

  const actions = createAutoLayoutFrame({ name: 'Actions', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  actions.primaryAxisAlignItems = 'SPACE_BETWEEN';
  actions.counterAxisAlignItems = 'CENTER';

  const draftStatus = createText({ text: '✓ 임시저장됨 14:35', size: 12, color: COLORS.textMuted });
  actions.appendChild(draftStatus);

  const btnGroup = createAutoLayoutFrame({ name: 'Btn Group', direction: 'HORIZONTAL', gap: 12 });
  btnGroup.appendChild(buildButton('초기화', 'secondary'));
  btnGroup.appendChild(buildButton('VOC 등록', 'primary'));
  actions.appendChild(btnGroup);
  card.appendChild(actions);

  content.appendChild(card);

  // ── 안내 사항 카드 ─────────────────────────────────────────────────
  const infoCard = createAutoLayoutFrame({
    name: 'Info Card',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 16,
    gap: 8,
    fill: '#eff6ff',
    cornerRadius: RADIUS.md,
    stroke: '#bfdbfe',
  });
  infoCard.appendChild(createText({ text: '안내 사항', size: 13, weight: 600, color: '#1e3a5f' }));
  const infoItems = [
    '• 등록된 VOC는 담당자 배정 후 처리가 진행됩니다',
    '• 티켓 번호를 통해 언제든지 처리 현황을 조회하실 수 있습니다',
    '• 긴급한 사항은 우선순위를 \'긴급\'으로 설정해주세요',
    '• 첨부파일은 최대 5개, 각 파일당 10MB까지 업로드 가능합니다',
  ];
  for (const item of infoItems) {
    infoCard.appendChild(createText({ text: item, size: 12, color: '#1d4ed8' }));
  }
  content.appendChild(infoCard);

  finalize(root);
  return [root];
}
