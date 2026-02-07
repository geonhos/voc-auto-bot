import { COLORS, RADIUS, STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';
import { buildButton, buildSelect, buildInput, buildBadge, buildTableHeader, buildTableRow } from '../design-system/components';

export async function generateVocList(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('VOC 목록');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: 'VOC 목록', size: 24, weight: 700 }));
  pageHeader.appendChild(buildButton('+ 새 VOC 등록', 'primary'));
  content.appendChild(pageHeader);

  // Filter bar
  const filterBar = createAutoLayoutFrame({
    name: 'Filter Bar',
    direction: 'HORIZONTAL',
    gap: 12,
    width: 'FILL',
    padding: 16,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });
  filterBar.counterAxisAlignItems = 'MAX';

  filterBar.appendChild(buildInput('검색', 'ID 또는 제목 검색...', 240));
  filterBar.appendChild(buildSelect('상태', '전체', 140));
  filterBar.appendChild(buildSelect('우선순위', '전체', 140));
  filterBar.appendChild(buildSelect('카테고리', '전체', 160));
  filterBar.appendChild(buildSelect('기간', '최근 30일', 140));
  filterBar.appendChild(buildButton('검색', 'primary'));
  content.appendChild(filterBar);

  // Table
  const table = createAutoLayoutFrame({
    name: 'VOC Table',
    direction: 'VERTICAL',
    width: 'FILL',
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  const colNames = ['', 'ID', '제목', '카테고리', '상태', '우선순위', '접수일', '담당자'];
  const colWidths = [40, 80, 280, 120, 100, 90, 100, 80];

  // Header
  const headerRow = createAutoLayoutFrame({
    name: 'Table Header',
    direction: 'HORIZONTAL',
    width: 'FILL',
    padding: { top: 10, right: 16, bottom: 10, left: 16 },
    fill: COLORS.bgLight,
  });
  for (let i = 0; i < colNames.length; i++) {
    const cell = createAutoLayoutFrame({ name: colNames[i] || 'Checkbox', direction: 'HORIZONTAL', width: colWidths[i] });
    if (i === 0) {
      const cb = createPlaceholder('CB', 16, 16, COLORS.borderLight);
      cb.cornerRadius = 3;
      cell.appendChild(cb);
    } else {
      cell.appendChild(createText({ text: colNames[i], size: 12, weight: 600, color: COLORS.textSecondary }));
    }
    headerRow.appendChild(cell);
  }
  table.appendChild(headerRow);

  // Data rows
  const data = [
    { id: 'VOC-001', title: '로그인 오류 반복 발생', cat: '시스템 오류', status: 'received', priority: 'HIGH', date: '2025-01-15', assignee: '김담당' },
    { id: 'VOC-002', title: '결제 화면 느려짐 현상 보고', cat: '성능 이슈', status: 'processing', priority: 'URGENT', date: '2025-01-14', assignee: '이분석' },
    { id: 'VOC-003', title: '앱 업데이트 후 크래시 발생', cat: '앱 오류', status: 'completed', priority: 'NORMAL', date: '2025-01-13', assignee: '박처리' },
    { id: 'VOC-004', title: '비밀번호 변경 메일 미수신', cat: '인증/보안', status: 'analyzing', priority: 'HIGH', date: '2025-01-12', assignee: '-' },
    { id: 'VOC-005', title: '검색 결과 정렬 오류', cat: 'UI/UX', status: 'received', priority: 'LOW', date: '2025-01-11', assignee: '-' },
    { id: 'VOC-006', title: '모바일 화면 깨짐', cat: 'UI/UX', status: 'failed', priority: 'NORMAL', date: '2025-01-10', assignee: '최수정' },
    { id: 'VOC-007', title: '데이터 수출 기능 요청', cat: '기능 요청', status: 'processing', priority: 'LOW', date: '2025-01-09', assignee: '김담당' },
  ];

  for (const d of data) {
    const row = createAutoLayoutFrame({
      name: `Row - ${d.id}`,
      direction: 'HORIZONTAL',
      width: 'FILL',
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
      stroke: COLORS.borderLight,
    });
    row.counterAxisAlignItems = 'CENTER';

    // Checkbox
    const cbCell = createAutoLayoutFrame({ name: 'CB Cell', direction: 'HORIZONTAL', width: colWidths[0] });
    const cb = createPlaceholder('CB', 16, 16, COLORS.borderLight);
    cb.cornerRadius = 3;
    cbCell.appendChild(cb);
    row.appendChild(cbCell);

    // ID
    const idCell = createAutoLayoutFrame({ name: 'ID', direction: 'HORIZONTAL', width: colWidths[1] });
    idCell.appendChild(createText({ text: d.id, size: 13, weight: 500, color: COLORS.primary }));
    row.appendChild(idCell);

    // Title
    const titleCell = createAutoLayoutFrame({ name: 'Title', direction: 'HORIZONTAL', width: colWidths[2] });
    titleCell.appendChild(createText({ text: d.title, size: 13 }));
    row.appendChild(titleCell);

    // Category
    const catCell = createAutoLayoutFrame({ name: 'Cat', direction: 'HORIZONTAL', width: colWidths[3] });
    catCell.appendChild(createText({ text: d.cat, size: 12, color: COLORS.textSecondary }));
    row.appendChild(catCell);

    // Status badge
    const statusCell = createAutoLayoutFrame({ name: 'Status', direction: 'HORIZONTAL', width: colWidths[4] });
    const sc = STATUS_COLORS[d.status] || STATUS_COLORS.received;
    statusCell.appendChild(buildBadge(d.status.toUpperCase(), sc.bg, sc.text));
    row.appendChild(statusCell);

    // Priority
    const priCell = createAutoLayoutFrame({ name: 'Priority', direction: 'HORIZONTAL', width: colWidths[5] });
    const pc = PRIORITY_COLORS[d.priority] || '#6B7280';
    priCell.appendChild(buildBadge(d.priority, pc, '#ffffff'));
    row.appendChild(priCell);

    // Date
    const dateCell = createAutoLayoutFrame({ name: 'Date', direction: 'HORIZONTAL', width: colWidths[6] });
    dateCell.appendChild(createText({ text: d.date, size: 12, color: COLORS.textSecondary }));
    row.appendChild(dateCell);

    // Assignee
    const assigneeCell = createAutoLayoutFrame({ name: 'Assignee', direction: 'HORIZONTAL', width: colWidths[7] });
    assigneeCell.appendChild(createText({ text: d.assignee, size: 12 }));
    row.appendChild(assigneeCell);

    table.appendChild(row);
  }
  content.appendChild(table);

  // Pagination
  const pagination = createAutoLayoutFrame({ name: 'Pagination', direction: 'HORIZONTAL', gap: 8, width: 'FILL' });
  pagination.primaryAxisAlignItems = 'CENTER';
  pagination.counterAxisAlignItems = 'CENTER';

  pagination.appendChild(createText({ text: '총 1,234건', size: 13, color: COLORS.textSecondary }));

  const pageNums = createAutoLayoutFrame({ name: 'Page Numbers', direction: 'HORIZONTAL', gap: 4 });
  const pages = ['< 이전', '1', '2', '3', '...', '42', '다음 >'];
  for (const p of pages) {
    const pageBtn = createAutoLayoutFrame({
      name: `Page ${p}`,
      direction: 'HORIZONTAL',
      padding: { top: 6, right: 10, bottom: 6, left: 10 },
      cornerRadius: RADIUS.sm,
      fill: p === '1' ? COLORS.primary : undefined,
      stroke: p === '1' ? undefined : COLORS.borderLight,
    });
    pageBtn.appendChild(createText({ text: p, size: 13, weight: p === '1' ? 600 : 400, color: p === '1' ? '#ffffff' : COLORS.textPrimary }));
    pageNums.appendChild(pageBtn);
  }
  pagination.appendChild(pageNums);
  content.appendChild(pagination);

  finalize(root);
  return [root];
}
