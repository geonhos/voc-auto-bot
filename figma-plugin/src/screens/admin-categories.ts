import { COLORS, RADIUS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';
import { buildButton, buildInput, buildSelect, buildTextarea } from '../design-system/components';

export async function generateAdminCategories(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('카테고리 관리');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: '카테고리 관리', size: 24, weight: 700 }));
  pageHeader.appendChild(buildButton('+ 카테고리 추가', 'primary'));
  content.appendChild(pageHeader);

  // Two-panel layout
  const panels = createAutoLayoutFrame({ name: 'Panels', direction: 'HORIZONTAL', gap: 24, width: 'FILL', height: 'FILL' });

  // Left panel - Category tree
  const leftPanel = createAutoLayoutFrame({
    name: 'Category Tree',
    direction: 'VERTICAL',
    width: 360,
    padding: 20,
    gap: 12,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
    height: 'FILL',
  });

  leftPanel.appendChild(createText({ text: '카테고리 트리', size: 16, weight: 600 }));

  // Search
  leftPanel.appendChild(buildInput('', '카테고리 검색...', 320));

  // Tree items
  const treeData = [
    { name: '시스템 오류', level: 0, count: 156, expanded: true },
    { name: '인증/보안', level: 1, count: 42, expanded: false },
    { name: '결제', level: 1, count: 38, expanded: false },
    { name: '서버 오류', level: 1, count: 76, expanded: false },
    { name: '성능 이슈', level: 0, count: 89, expanded: true },
    { name: '속도 저하', level: 1, count: 54, expanded: false },
    { name: '타임아웃', level: 1, count: 35, expanded: false },
    { name: 'UI/UX', level: 0, count: 203, expanded: false },
    { name: '기능 요청', level: 0, count: 178, expanded: false },
    { name: '앱 오류', level: 0, count: 67, expanded: false },
    { name: '데이터 문제', level: 0, count: 45, expanded: false },
  ];

  for (const item of treeData) {
    const treeItem = createAutoLayoutFrame({
      name: item.name,
      direction: 'HORIZONTAL',
      gap: 8,
      width: 'FILL',
      padding: { top: 8, right: 12, bottom: 8, left: 12 + item.level * 20 },
      cornerRadius: RADIUS.sm,
      fill: item.name === '인증/보안' ? COLORS.primary + '10' : undefined,
    });
    treeItem.counterAxisAlignItems = 'CENTER';
    treeItem.primaryAxisAlignItems = 'SPACE_BETWEEN';

    const left = createAutoLayoutFrame({ name: 'Left', direction: 'HORIZONTAL', gap: 8 });
    left.counterAxisAlignItems = 'CENTER';

    if (item.level === 0) {
      left.appendChild(createText({
        text: item.expanded ? '▼' : '▶',
        size: 10,
        color: COLORS.textSecondary,
      }));
    }

    const icon = createPlaceholder('Icon', 16, 16, item.level === 0 ? COLORS.primary : COLORS.primaryLight);
    icon.cornerRadius = 3;
    left.appendChild(icon);
    left.appendChild(createText({
      text: item.name,
      size: 13,
      weight: item.name === '인증/보안' ? 600 : 400,
      color: item.name === '인증/보안' ? COLORS.primary : COLORS.textPrimary,
    }));
    treeItem.appendChild(left);

    treeItem.appendChild(createText({ text: String(item.count), size: 12, color: COLORS.textMuted }));
    leftPanel.appendChild(treeItem);
  }

  panels.appendChild(leftPanel);

  // Right panel - Category detail / edit form
  const rightPanel = createAutoLayoutFrame({
    name: 'Category Detail',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 24,
    gap: 20,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  rightPanel.appendChild(createText({ text: '카테고리 편집', size: 18, weight: 600 }));

  const form = createAutoLayoutFrame({ name: 'Form', direction: 'VERTICAL', gap: 16, width: 'FILL' });

  form.appendChild(buildInput('카테고리명', '인증/보안', 500));
  form.appendChild(buildSelect('상위 카테고리', '시스템 오류', 500));
  form.appendChild(buildTextarea('설명', '인증, 로그인, 보안 관련 VOC를 분류합니다.', 500, 80));
  form.appendChild(buildInput('키워드 (자동 분류용)', '로그인, 인증, 비밀번호, 토큰, 2FA, MFA', 500));
  form.appendChild(buildSelect('활성 상태', '활성', 200));

  rightPanel.appendChild(form);

  // Stats
  const statsSection = createAutoLayoutFrame({ name: 'Stats', direction: 'VERTICAL', gap: 12, width: 'FILL' });
  statsSection.appendChild(createText({ text: '통계', size: 16, weight: 600 }));

  const statsRow = createAutoLayoutFrame({ name: 'Stats Row', direction: 'HORIZONTAL', gap: 16, width: 'FILL' });
  const statItems = [
    { label: '총 VOC', value: '42' },
    { label: '이번 달', value: '12' },
    { label: '처리율', value: '85%' },
    { label: '평균 처리시간', value: '1.8일' },
  ];
  for (const stat of statItems) {
    const statCard = createAutoLayoutFrame({
      name: stat.label,
      direction: 'VERTICAL',
      gap: 4,
      width: 'FILL',
      padding: 12,
      fill: COLORS.bgLight,
      cornerRadius: RADIUS.md,
    });
    statCard.appendChild(createText({ text: stat.label, size: 11, weight: 500, color: COLORS.textSecondary }));
    statCard.appendChild(createText({ text: stat.value, size: 20, weight: 700 }));
    statsRow.appendChild(statCard);
  }
  statsSection.appendChild(statsRow);
  rightPanel.appendChild(statsSection);

  // Form actions
  const actions = createAutoLayoutFrame({ name: 'Actions', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  actions.primaryAxisAlignItems = 'MAX';
  actions.appendChild(buildButton('삭제', 'danger'));
  actions.appendChild(buildButton('취소', 'secondary'));
  actions.appendChild(buildButton('저장', 'primary'));
  rightPanel.appendChild(actions);

  panels.appendChild(rightPanel);
  content.appendChild(panels);
  finalize(root);
  return [root];
}
