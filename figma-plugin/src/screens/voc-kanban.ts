import { COLORS, RADIUS, STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';
import { buildButton, buildBadge } from '../design-system/components';

export async function generateVocKanban(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('VOC 칸반');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';

  const leftHeader = createAutoLayoutFrame({ name: 'Left', direction: 'HORIZONTAL', gap: 16 });
  leftHeader.counterAxisAlignItems = 'CENTER';
  leftHeader.appendChild(createText({ text: 'VOC 칸반 보드', size: 24, weight: 700 }));

  // View toggle
  const viewToggle = createAutoLayoutFrame({
    name: 'View Toggle',
    direction: 'HORIZONTAL',
    cornerRadius: RADIUS.md,
    stroke: COLORS.borderLight,
  });
  const listView = createAutoLayoutFrame({ name: 'List', direction: 'HORIZONTAL', padding: { top: 6, right: 12, bottom: 6, left: 12 } });
  listView.appendChild(createText({ text: '목록', size: 13, color: COLORS.textSecondary }));
  const kanbanView = createAutoLayoutFrame({ name: 'Kanban', direction: 'HORIZONTAL', padding: { top: 6, right: 12, bottom: 6, left: 12 }, fill: COLORS.primary });
  kanbanView.appendChild(createText({ text: '칸반', size: 13, weight: 600, color: '#ffffff' }));
  viewToggle.appendChild(listView);
  viewToggle.appendChild(kanbanView);
  leftHeader.appendChild(viewToggle);

  pageHeader.appendChild(leftHeader);
  pageHeader.appendChild(buildButton('+ 새 VOC', 'primary'));
  content.appendChild(pageHeader);

  // Kanban board
  const board = createAutoLayoutFrame({
    name: 'Kanban Board',
    direction: 'HORIZONTAL',
    gap: 16,
    width: 'FILL',
    height: 'FILL',
  });

  // Column definitions
  const columns = [
    {
      title: '접수',
      status: 'received',
      cards: [
        { id: 'VOC-005', title: '검색 결과 정렬 오류', priority: 'LOW', assignee: '-', date: '01-11' },
        { id: 'VOC-008', title: 'API 응답 속도 느림', priority: 'NORMAL', assignee: '-', date: '01-10' },
      ],
    },
    {
      title: '분석중',
      status: 'analyzing',
      cards: [
        { id: 'VOC-004', title: '비밀번호 변경 메일 미수신', priority: 'HIGH', assignee: '이분석', date: '01-12' },
      ],
    },
    {
      title: '처리중',
      status: 'processing',
      cards: [
        { id: 'VOC-002', title: '결제 화면 느려짐 현상 보고', priority: 'URGENT', assignee: '이분석', date: '01-14' },
        { id: 'VOC-007', title: '데이터 수출 기능 요청', priority: 'LOW', assignee: '김담당', date: '01-09' },
      ],
    },
    {
      title: '완료',
      status: 'completed',
      cards: [
        { id: 'VOC-003', title: '앱 업데이트 후 크래시', priority: 'NORMAL', assignee: '박처리', date: '01-13' },
        { id: 'VOC-009', title: '회원가입 이메일 인증 실패', priority: 'HIGH', assignee: '최수정', date: '01-08' },
        { id: 'VOC-010', title: '알림 설정 저장 안 됨', priority: 'LOW', assignee: '김담당', date: '01-07' },
      ],
    },
    {
      title: '실패',
      status: 'failed',
      cards: [
        { id: 'VOC-006', title: '모바일 화면 깨짐', priority: 'NORMAL', assignee: '최수정', date: '01-10' },
      ],
    },
    {
      title: '반려',
      status: 'rejected',
      cards: [
        { id: 'VOC-011', title: '스팸 문의', priority: 'LOW', assignee: '-', date: '01-06' },
      ],
    },
  ];

  for (const col of columns) {
    const sc = STATUS_COLORS[col.status] || STATUS_COLORS.received;

    const column = createAutoLayoutFrame({
      name: `Column - ${col.title}`,
      direction: 'VERTICAL',
      width: 'FILL',
      gap: 12,
      height: 'FILL',
    });

    // Column header
    const colHeader = createAutoLayoutFrame({
      name: 'Column Header',
      direction: 'HORIZONTAL',
      width: 'FILL',
      padding: { top: 10, right: 12, bottom: 10, left: 12 },
      fill: sc.bg,
      cornerRadius: RADIUS.md,
    });
    colHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
    colHeader.counterAxisAlignItems = 'CENTER';

    const headerLeft = createAutoLayoutFrame({ name: 'Left', direction: 'HORIZONTAL', gap: 8 });
    headerLeft.counterAxisAlignItems = 'CENTER';
    headerLeft.appendChild(createText({ text: col.title, size: 14, weight: 600, color: sc.text }));

    const countBadge = createAutoLayoutFrame({
      name: 'Count',
      direction: 'HORIZONTAL',
      padding: { top: 2, right: 8, bottom: 2, left: 8 },
      fill: sc.text + '20',
      cornerRadius: 9999,
    });
    countBadge.appendChild(createText({ text: String(col.cards.length), size: 11, weight: 600, color: sc.text }));
    headerLeft.appendChild(countBadge);
    colHeader.appendChild(headerLeft);

    colHeader.appendChild(createText({ text: '+', size: 18, color: sc.text }));
    column.appendChild(colHeader);

    // Cards
    for (const card of col.cards) {
      const pc = PRIORITY_COLORS[card.priority] || '#6B7280';

      const kanbanCard = createAutoLayoutFrame({
        name: `Card - ${card.id}`,
        direction: 'VERTICAL',
        width: 'FILL',
        padding: 12,
        gap: 8,
        fill: COLORS.surfaceLight,
        cornerRadius: RADIUS.md,
        stroke: COLORS.borderLight,
      });

      // Card header
      const cardHeader = createAutoLayoutFrame({ name: 'Card Header', direction: 'HORIZONTAL', width: 'FILL' });
      cardHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
      cardHeader.counterAxisAlignItems = 'CENTER';
      cardHeader.appendChild(createText({ text: card.id, size: 12, weight: 500, color: COLORS.primary }));
      cardHeader.appendChild(buildBadge(card.priority, pc, '#ffffff'));
      kanbanCard.appendChild(cardHeader);

      // Title
      kanbanCard.appendChild(createText({ text: card.title, size: 13, weight: 500, width: 'FILL' }));

      // Card footer
      const cardFooter = createAutoLayoutFrame({ name: 'Card Footer', direction: 'HORIZONTAL', width: 'FILL' });
      cardFooter.primaryAxisAlignItems = 'SPACE_BETWEEN';
      cardFooter.counterAxisAlignItems = 'CENTER';

      const assigneeArea = createAutoLayoutFrame({ name: 'Assignee', direction: 'HORIZONTAL', gap: 4 });
      assigneeArea.counterAxisAlignItems = 'CENTER';
      if (card.assignee !== '-') {
        const miniAvatar = createPlaceholder('Avatar', 20, 20, COLORS.primaryLight);
        miniAvatar.cornerRadius = 9999;
        assigneeArea.appendChild(miniAvatar);
      }
      assigneeArea.appendChild(createText({ text: card.assignee, size: 11, color: COLORS.textSecondary }));
      cardFooter.appendChild(assigneeArea);

      cardFooter.appendChild(createText({ text: card.date, size: 11, color: COLORS.textMuted }));
      kanbanCard.appendChild(cardFooter);

      column.appendChild(kanbanCard);
    }

    board.appendChild(column);
  }

  content.appendChild(board);
  finalize(root);
  return [root];
}
