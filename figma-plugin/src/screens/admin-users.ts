import { COLORS, RADIUS } from '../utils/constants';
import { buildAppShell, createAutoLayoutFrame, createText, createPlaceholder, finalize } from '../utils/helpers';
import { buildButton, buildInput, buildSelect, buildBadge, buildTableHeader, buildTableRow } from '../design-system/components';

export async function generateAdminUsers(): Promise<FrameNode[]> {

  const { root, content } = buildAppShell('사용자 관리');

  // Page header
  const pageHeader = createAutoLayoutFrame({ name: 'Page Header', direction: 'HORIZONTAL', width: 'FILL' });
  pageHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pageHeader.counterAxisAlignItems = 'CENTER';
  pageHeader.appendChild(createText({ text: '사용자 관리', size: 24, weight: 700 }));
  pageHeader.appendChild(buildButton('+ 사용자 추가', 'primary'));
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
  filterBar.appendChild(buildInput('검색', '이름 또는 이메일...', 240));
  filterBar.appendChild(buildSelect('역할', '전체', 140));
  filterBar.appendChild(buildSelect('상태', '전체', 140));
  filterBar.appendChild(buildButton('검색', 'primary'));
  content.appendChild(filterBar);

  // User table
  const table = createAutoLayoutFrame({
    name: 'User Table',
    direction: 'VERTICAL',
    width: 'FILL',
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  const colNames = ['', '이름', '이메일', '역할', '상태', '최근 로그인', '액션'];
  const colWidths = [48, 120, 200, 100, 80, 120, 120];

  // Header
  const headerRow = createAutoLayoutFrame({
    name: 'Table Header',
    direction: 'HORIZONTAL',
    width: 'FILL',
    padding: { top: 10, right: 16, bottom: 10, left: 16 },
    fill: COLORS.bgLight,
  });
  for (let i = 0; i < colNames.length; i++) {
    const cell = createAutoLayoutFrame({ name: colNames[i] || 'Avatar', direction: 'HORIZONTAL', width: colWidths[i] });
    if (colNames[i]) {
      cell.appendChild(createText({ text: colNames[i], size: 12, weight: 600, color: COLORS.textSecondary }));
    }
    headerRow.appendChild(cell);
  }
  table.appendChild(headerRow);

  // Data rows
  const users = [
    { name: '김관리', email: 'admin@vocbot.com', role: 'ADMIN', active: true, lastLogin: '2025-01-15' },
    { name: '이담당', email: 'lee@vocbot.com', role: 'MANAGER', active: true, lastLogin: '2025-01-15' },
    { name: '박분석', email: 'park@vocbot.com', role: 'ANALYST', active: true, lastLogin: '2025-01-14' },
    { name: '최운영', email: 'choi@vocbot.com', role: 'OPERATOR', active: false, lastLogin: '2025-01-10' },
    { name: '정개발', email: 'jung@vocbot.com', role: 'ADMIN', active: true, lastLogin: '2025-01-15' },
  ];

  for (const u of users) {
    const row = createAutoLayoutFrame({
      name: `Row - ${u.name}`,
      direction: 'HORIZONTAL',
      width: 'FILL',
      padding: { top: 12, right: 16, bottom: 12, left: 16 },
      stroke: COLORS.borderLight,
    });
    row.counterAxisAlignItems = 'CENTER';

    // Avatar
    const avatarCell = createAutoLayoutFrame({ name: 'Avatar', direction: 'HORIZONTAL', width: colWidths[0] });
    const avatar = createPlaceholder('Avatar', 32, 32, COLORS.primaryLight);
    avatar.cornerRadius = 9999;
    avatarCell.appendChild(avatar);
    row.appendChild(avatarCell);

    // Name
    const nameCell = createAutoLayoutFrame({ name: 'Name', direction: 'HORIZONTAL', width: colWidths[1] });
    nameCell.appendChild(createText({ text: u.name, size: 14, weight: 500 }));
    row.appendChild(nameCell);

    // Email
    const emailCell = createAutoLayoutFrame({ name: 'Email', direction: 'HORIZONTAL', width: colWidths[2] });
    emailCell.appendChild(createText({ text: u.email, size: 13, color: COLORS.textSecondary }));
    row.appendChild(emailCell);

    // Role
    const roleCell = createAutoLayoutFrame({ name: 'Role', direction: 'HORIZONTAL', width: colWidths[3] });
    const roleColor = u.role === 'ADMIN' ? COLORS.danger : u.role === 'MANAGER' ? COLORS.warning : COLORS.info;
    roleCell.appendChild(buildBadge(u.role, roleColor + '20', roleColor));
    row.appendChild(roleCell);

    // Status
    const statusCell = createAutoLayoutFrame({ name: 'Status', direction: 'HORIZONTAL', width: colWidths[4] });
    statusCell.appendChild(buildBadge(
      u.active ? '활성' : '비활성',
      u.active ? '#e1e9e0' : '#ebe2e0',
      u.active ? '#475c47' : '#704040',
    ));
    row.appendChild(statusCell);

    // Last login
    const loginCell = createAutoLayoutFrame({ name: 'Last Login', direction: 'HORIZONTAL', width: colWidths[5] });
    loginCell.appendChild(createText({ text: u.lastLogin, size: 12, color: COLORS.textSecondary }));
    row.appendChild(loginCell);

    // Actions
    const actionCell = createAutoLayoutFrame({ name: 'Actions', direction: 'HORIZONTAL', gap: 8, width: colWidths[6] });
    actionCell.appendChild(buildButton('편집', 'ghost'));
    actionCell.appendChild(buildButton('삭제', 'danger'));
    row.appendChild(actionCell);

    table.appendChild(row);
  }
  content.appendChild(table);

  // ── Modal overlay (shown next to the page) ────────────────────────
  const modal = createAutoLayoutFrame({
    name: 'Modal — User Edit',
    direction: 'VERTICAL',
    width: 480,
    padding: 24,
    gap: 20,
    fill: COLORS.surfaceLight,
    cornerRadius: RADIUS.lg,
    stroke: COLORS.borderLight,
  });

  // Modal header
  const modalHeader = createAutoLayoutFrame({ name: 'Modal Header', direction: 'HORIZONTAL', width: 'FILL' });
  modalHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  modalHeader.counterAxisAlignItems = 'CENTER';
  modalHeader.appendChild(createText({ text: '사용자 편집', size: 18, weight: 600 }));
  modalHeader.appendChild(createText({ text: '✕', size: 18, color: COLORS.textSecondary }));
  modal.appendChild(modalHeader);

  modal.appendChild(buildInput('이름', '김관리', 430));
  modal.appendChild(buildInput('이메일', 'admin@vocbot.com', 430));
  modal.appendChild(buildSelect('역할', 'ADMIN', 430));
  modal.appendChild(buildSelect('상태', '활성', 430));

  const modalActions = createAutoLayoutFrame({ name: 'Modal Actions', direction: 'HORIZONTAL', gap: 12, width: 'FILL' });
  modalActions.primaryAxisAlignItems = 'MAX';
  modalActions.appendChild(buildButton('취소', 'secondary'));
  modalActions.appendChild(buildButton('저장', 'primary'));
  modal.appendChild(modalActions);

  finalize(root);
  finalize(modal);
  return [root, modal];
}
