import { COLORS, RADIUS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize, markFillH } from '../utils/helpers';
import { buildButton, buildInput, buildSelect, buildTextarea } from '../design-system/components';

export async function generateEmailCompose(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('이메일 작성');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: '이메일 작성', size: 24, weight: 700 }));

  const headerActions = createAutoLayoutFrame({ name: 'Header Actions', direction: 'HORIZONTAL', gap: 8 });
  headerActions.appendChild(buildButton('템플릿 선택', 'secondary'));
  headerActions.appendChild(buildButton('AI 초안 생성', 'primary'));
  pageHeader.appendChild(headerActions);
  content.appendChild(pageHeader);

  // Two-column layout
  const columns = createAutoLayoutFrame({ name: 'Columns', direction: 'HORIZONTAL', gap: 24, width: 'FILL', height: 'FILL' });

  // Left column - Email form
  const leftCol = createAutoLayoutFrame({
    name: 'Email Form',
    direction: 'VERTICAL',
    width: 'FILL',
    padding: 24,
    gap: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  leftCol.appendChild(buildInput('받는 사람', 'customer@example.com', 600));
  leftCol.appendChild(buildInput('참조 (CC)', '', 600));

  const subjectRow = createAutoLayoutFrame({ name: 'Subject Row', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  const subjectInput = buildInput('제목', '[VOC-001] 로그인 오류 관련 안내', 500);
  markFillH(subjectInput);
  subjectRow.appendChild(subjectInput);
  leftCol.appendChild(subjectRow);

  // Email body
  const bodyArea = buildTextarea('본문', '안녕하세요, 고객님.\n\n접수하신 VOC 건에 대해 안내드립니다...\n\n감사합니다.\nVOC Auto Bot 팀', 600, 280);
  markFillH(bodyArea);
  leftCol.appendChild(bodyArea);

  // Attachment area
  const attachArea = createAutoLayoutFrame({
    name: 'Attachments',
    direction: 'VERTICAL',
    gap: 8,
    width: 'FILL',
  });
  attachArea.appendChild(createText({ text: '첨부파일', size: 13, weight: 500 }));
  const dropzone = createAutoLayoutFrame({
    name: 'Dropzone',
    direction: 'VERTICAL',
    width: 'FILL',
    height: 60,
    cornerRadius: RADIUS.md,
    stroke: COLORS.borderLight,
    strokeWeight: 2,
  });
  dropzone.primaryAxisAlignItems = 'CENTER';
  dropzone.counterAxisAlignItems = 'CENTER';
  dropzone.dashPattern = [6, 4];
  dropzone.appendChild(createText({ text: '파일을 드래그하거나 클릭하여 업로드', size: 13, color: COLORS.textMuted }));
  attachArea.appendChild(dropzone);
  leftCol.appendChild(attachArea);

  // Send actions
  const sendActions = createAutoLayoutFrame({ name: 'Send Actions', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  sendActions.primaryAxisAlignItems = 'MAX';
  sendActions.appendChild(buildButton('임시저장', 'secondary'));
  sendActions.appendChild(buildButton('미리보기', 'ghost'));
  sendActions.appendChild(buildButton('발송', 'primary'));
  leftCol.appendChild(sendActions);

  columns.appendChild(leftCol);

  // Right column - VOC context panel
  const rightCol = createAutoLayoutFrame({
    name: 'VOC Context',
    direction: 'VERTICAL',
    width: 320,
    padding: 20,
    gap: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  rightCol.appendChild(createText({ text: '관련 VOC 정보', size: 16, weight: 600 }));

  const vocInfo = [
    ['VOC ID', 'VOC-2025-0001'],
    ['상태', '처리중'],
    ['우선순위', 'HIGH'],
    ['카테고리', '시스템 오류 > 인증'],
    ['접수일', '2025-01-15'],
    ['고객명', '홍길동'],
  ];

  for (const [label, value] of vocInfo) {
    const row = createAutoLayoutFrame({ name: label, direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.appendChild(createText({ text: label, size: 12, weight: 500, color: COLORS.textSecondary }));
    row.appendChild(createText({ text: value, size: 12, weight: 500 }));
    rightCol.appendChild(row);
  }

  // AI suggestion
  const aiSuggestion = createAutoLayoutFrame({
    name: 'AI Suggestion',
    direction: 'VERTICAL',
    gap: 8,
    width: 'FILL',
    padding: 12,
    fill: '#f0f4ff',
    cornerRadius: RADIUS.md,
  });
  aiSuggestion.appendChild(createText({ text: 'AI 분석 요약', size: 12, weight: 600, color: COLORS.info }));
  aiSuggestion.appendChild(createText({
    text: '로그인 인증 토큰 만료 문제로 추정됩니다. 유사 VOC 3건이 동일 기간에 접수되었습니다.',
    size: 12,
    color: COLORS.textSecondary,
    width: 'FILL',
  }));
  rightCol.appendChild(aiSuggestion);

  columns.appendChild(rightCol);
  content.appendChild(columns);
  finalize(root);
  return [root];
}
