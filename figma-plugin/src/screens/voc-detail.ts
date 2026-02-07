import { COLORS, RADIUS, STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';
import { buildButton, buildBadge, buildSelect, buildTextarea } from '../design-system/components';

export async function generateVocDetail(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('VOC 상세');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';

  const headerLeft = createAutoLayoutFrame({ name: 'Left', direction: 'HORIZONTAL', gap: 12 });
  headerLeft.counterAxisAlignItems = 'CENTER';
  headerLeft.appendChild(createText({ text: '← 목록', size: 14, color: COLORS.primary }));
  headerLeft.appendChild(createText({ text: 'VOC-2025-0001', size: 24, weight: 700 }));
  headerLeft.appendChild(buildBadge('처리중', STATUS_COLORS.processing.bg, STATUS_COLORS.processing.text));
  headerLeft.appendChild(buildBadge('HIGH', PRIORITY_COLORS.HIGH, '#ffffff'));
  pageHeader.appendChild(headerLeft);

  const headerActions = createAutoLayoutFrame({ name: 'Actions', direction: 'HORIZONTAL', gap: 8 });
  headerActions.appendChild(buildButton('이메일 작성', 'secondary'));
  headerActions.appendChild(buildButton('상태 변경', 'primary'));
  pageHeader.appendChild(headerActions);
  content.appendChild(pageHeader);

  // Two-column layout
  const columns = createAutoLayoutFrame({ name: 'Columns', direction: 'HORIZONTAL', gap: 24, width: 'FILL' });

  // ── Left column (main content) ────────────────────────────────────
  const leftCol = createAutoLayoutFrame({
    name: 'Main Content',
    direction: 'VERTICAL',
    width: 'FILL',
    gap: 20,
  });

  // Section 1: VOC Content
  const vocContent = buildSection('VOC 내용');
  vocContent.appendChild(createText({
    text: '로그인 시도 시 "인증 실패" 오류가 반복적으로 발생합니다. 비밀번호를 재설정해도 동일한 문제가 지속됩니다. 크롬 브라우저에서만 발생하며, 사파리에서는 정상 로그인됩니다. 쿠키 삭제 후에도 동일합니다.',
    size: 14,
    width: 'FILL',
  }));

  const metaRow = createAutoLayoutFrame({ name: 'Meta', direction: 'HORIZONTAL', gap: 24, width: 'FILL' });
  const metaItems = [
    ['접수일', '2025-01-15 14:30'],
    ['접수 경로', '웹'],
    ['카테고리', '시스템 오류 > 인증/보안'],
  ];
  for (const [label, value] of metaItems) {
    const meta = createAutoLayoutFrame({ name: label, direction: 'HORIZONTAL', gap: 6 });
    meta.appendChild(createText({ text: `${label}:`, size: 12, weight: 500, color: COLORS.textSecondary }));
    meta.appendChild(createText({ text: value, size: 12, weight: 500 }));
    metaRow.appendChild(meta);
  }
  vocContent.appendChild(metaRow);
  leftCol.appendChild(vocContent);

  // Section 2: AI Analysis
  const aiSection = buildSection('AI 분석 결과');

  const aiHeader = createAutoLayoutFrame({ name: 'AI Header', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  aiHeader.counterAxisAlignItems = 'CENTER';
  aiHeader.appendChild(buildBadge('RAG', '#dbeafe', '#1e40af'));
  aiHeader.appendChild(createText({ text: '신뢰도: 87%', size: 13, weight: 500, color: COLORS.success }));
  aiSection.appendChild(aiHeader);

  // Confidence bar
  const confBar = createAutoLayoutFrame({ name: 'Confidence', direction: 'VERTICAL', gap: 4, width: 'FILL' });
  const barBg = createAutoLayoutFrame({ name: 'Bar BG', direction: 'HORIZONTAL', width: 'FILL', height: 8, fill: '#e5e7eb', cornerRadius: 9999 });
  const barFill = createPlaceholder('Bar Fill', 300, 8, COLORS.success);
  barFill.cornerRadius = 9999;
  barBg.appendChild(barFill);
  confBar.appendChild(barBg);
  aiSection.appendChild(confBar);

  // Analysis content
  const analysisContent = createAutoLayoutFrame({
    name: 'Analysis',
    direction: 'VERTICAL',
    gap: 12,
    width: 'FILL',
    padding: 16,
    fill: '#f0f4ff',
    cornerRadius: RADIUS.md,
  });

  analysisContent.appendChild(createText({ text: '분석 요약', size: 14, weight: 600, color: COLORS.info }));
  analysisContent.appendChild(createText({
    text: '크롬 브라우저의 SameSite 쿠키 정책 변경으로 인한 인증 토큰 전달 실패로 추정됩니다. 유사 VOC 3건이 동일 기간에 접수되었으며, 모두 크롬 최신 버전 사용자입니다.',
    size: 13,
    width: 'FILL',
  }));

  // Suggested category
  const sugCat = createAutoLayoutFrame({ name: 'Suggested Category', direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
  sugCat.appendChild(createText({ text: '추천 카테고리:', size: 13, weight: 500, color: COLORS.textSecondary }));
  sugCat.appendChild(buildBadge('인증/보안', COLORS.info + '20', COLORS.info));
  analysisContent.appendChild(sugCat);

  // Suggested priority
  const sugPri = createAutoLayoutFrame({ name: 'Suggested Priority', direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
  sugPri.appendChild(createText({ text: '추천 우선순위:', size: 13, weight: 500, color: COLORS.textSecondary }));
  sugPri.appendChild(buildBadge('HIGH', PRIORITY_COLORS.HIGH, '#ffffff'));
  analysisContent.appendChild(sugPri);

  aiSection.appendChild(analysisContent);
  leftCol.appendChild(aiSection);

  // Section 3: Similar VOCs
  const similarSection = buildSection('유사 VOC');

  const similarItems = [
    { id: 'VOC-0998', title: '크롬에서 로그인 불가', score: '92%', date: '2025-01-14' },
    { id: 'VOC-0995', title: '인증 토큰 만료 오류', score: '87%', date: '2025-01-13' },
    { id: 'VOC-0987', title: '브라우저별 로그인 차이', score: '81%', date: '2025-01-10' },
  ];

  for (const item of similarItems) {
    const row = createAutoLayoutFrame({
      name: item.id,
      direction: 'HORIZONTAL',
      width: 'FILL',
      padding: 12,
      cornerRadius: RADIUS.sm,
      stroke: COLORS.borderLight,
    });
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.counterAxisAlignItems = 'CENTER';

    const rowLeft = createAutoLayoutFrame({ name: 'Left', direction: 'VERTICAL', gap: 4 });
    const idRow = createAutoLayoutFrame({ name: 'ID Row', direction: 'HORIZONTAL', gap: 8 });
    idRow.appendChild(createText({ text: item.id, size: 13, weight: 500, color: COLORS.primary }));
    idRow.appendChild(createText({ text: item.date, size: 11, color: COLORS.textMuted }));
    rowLeft.appendChild(idRow);
    rowLeft.appendChild(createText({ text: item.title, size: 13 }));
    row.appendChild(rowLeft);

    const scoreBadge = createAutoLayoutFrame({
      name: 'Score',
      direction: 'HORIZONTAL',
      padding: { top: 4, right: 10, bottom: 4, left: 10 },
      fill: COLORS.success + '15',
      cornerRadius: RADIUS.sm,
    });
    scoreBadge.appendChild(createText({ text: `유사도 ${item.score}`, size: 12, weight: 500, color: COLORS.success }));
    row.appendChild(scoreBadge);

    similarSection.appendChild(row);
  }
  leftCol.appendChild(similarSection);

  // Section 4: Processing History / Timeline
  const historySection = buildSection('처리 이력');

  const timelineItems = [
    { time: '01-15 14:30', action: 'VOC 접수', user: '시스템', icon: COLORS.info },
    { time: '01-15 14:31', action: 'AI 자동 분석 완료 (카테고리: 인증/보안, 우선순위: HIGH)', user: 'AI', icon: COLORS.primary },
    { time: '01-15 15:00', action: '담당자 배정: 이분석', user: '김관리', icon: COLORS.warning },
    { time: '01-16 09:30', action: '처리 시작', user: '이분석', icon: COLORS.success },
  ];

  for (const item of timelineItems) {
    const timelineRow = createAutoLayoutFrame({
      name: item.action,
      direction: 'HORIZONTAL',
      gap: 12,
      width: 'FILL',
    });

    // Timeline dot + line
    const dotCol = createAutoLayoutFrame({ name: 'Dot', direction: 'VERTICAL', gap: 0 });
    dotCol.counterAxisAlignItems = 'CENTER';
    const dot = createPlaceholder('Dot', 12, 12, item.icon);
    dot.cornerRadius = 9999;
    dotCol.appendChild(dot);
    timelineRow.appendChild(dotCol);

    // Content
    const contentCol = createAutoLayoutFrame({ name: 'Content', direction: 'VERTICAL', gap: 2, width: 'FILL' });
    contentCol.appendChild(createText({ text: item.action, size: 13 }));

    const footerRow = createAutoLayoutFrame({ name: 'Footer', direction: 'HORIZONTAL', gap: 8 });
    footerRow.appendChild(createText({ text: item.time, size: 11, color: COLORS.textMuted }));
    footerRow.appendChild(createText({ text: `by ${item.user}`, size: 11, color: COLORS.textSecondary }));
    contentCol.appendChild(footerRow);
    timelineRow.appendChild(contentCol);

    historySection.appendChild(timelineRow);
  }
  leftCol.appendChild(historySection);

  columns.appendChild(leftCol);

  // ── Right column (sidebar) ────────────────────────────────────────
  const rightCol = createAutoLayoutFrame({
    name: 'Sidebar',
    direction: 'VERTICAL',
    width: 320,
    gap: 20,
  });

  // Section 5: Customer Info
  const customerSection = buildSection('고객 정보');
  const customerInfo = [
    ['이름', '홍길동'],
    ['이메일', 'hong@example.com'],
    ['연락처', '010-1234-5678'],
    ['회사', '(주)테스트'],
  ];
  for (const [label, value] of customerInfo) {
    const row = createAutoLayoutFrame({ name: label, direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.appendChild(createText({ text: label, size: 13, color: COLORS.textSecondary }));
    row.appendChild(createText({ text: value, size: 13, weight: 500 }));
    customerSection.appendChild(row);
  }
  rightCol.appendChild(customerSection);

  // Section 6: Assignment
  const assignSection = buildSection('담당 정보');

  const assignRow = createAutoLayoutFrame({ name: 'Assignee', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  assignRow.counterAxisAlignItems = 'CENTER';
  const avatar = createPlaceholder('Avatar', 40, 40, COLORS.primaryLight);
  avatar.cornerRadius = 9999;
  assignRow.appendChild(avatar);
  const assignInfo = createAutoLayoutFrame({ name: 'Info', direction: 'VERTICAL', gap: 2 });
  assignInfo.appendChild(createText({ text: '이분석', size: 14, weight: 600 }));
  assignInfo.appendChild(createText({ text: '분석팀 | lee@vocbot.com', size: 12, color: COLORS.textSecondary }));
  assignRow.appendChild(assignInfo);
  assignSection.appendChild(assignRow);

  assignSection.appendChild(buildSelect('담당자 변경', '이분석', 280));
  rightCol.appendChild(assignSection);

  // Section 7: Actions / Notes
  const actionSection = buildSection('메모');

  const noteArea = buildTextarea('', '메모를 입력하세요...', 280, 80);
  actionSection.appendChild(noteArea);
  actionSection.appendChild(buildButton('메모 추가', 'secondary'));

  // Existing notes
  const noteItem = createAutoLayoutFrame({
    name: 'Note',
    direction: 'VERTICAL',
    gap: 4,
    width: 'FILL',
    padding: 12,
    fill: COLORS.bgLight,
    cornerRadius: RADIUS.md,
  });
  const noteHeader = createAutoLayoutFrame({ name: 'Note Header', direction: 'HORIZONTAL', gap: 8 });
  noteHeader.appendChild(createText({ text: '이분석', size: 12, weight: 600 }));
  noteHeader.appendChild(createText({ text: '01-16 09:35', size: 11, color: COLORS.textMuted }));
  noteItem.appendChild(noteHeader);
  noteItem.appendChild(createText({
    text: '크롬 최신 버전에서 SameSite 정책 확인 필요. 백엔드 쿠키 설정 검토 중.',
    size: 12,
    color: COLORS.textSecondary,
    width: 'FILL',
  }));
  actionSection.appendChild(noteItem);

  rightCol.appendChild(actionSection);

  columns.appendChild(rightCol);
  content.appendChild(columns);
  finalize(root);
  return [root];
}

// Helper to create a section card
function buildSection(title: string): FrameNode {
  const section = createAutoLayoutFrame({
    name: title,
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 20,
    gap: 12,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  section.appendChild(createText({ text: title, size: 16, weight: 600 }));
  return section;
}
