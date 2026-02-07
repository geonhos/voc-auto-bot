import { COLORS, RADIUS } from './utils/constants';
import { solidPaint, createAutoLayoutFrame, createText, fontName, finalize } from './utils/helpers';

// ── Layout Constants ────────────────────────────────────────────────

const SCREEN_W = 1440;
const SCREEN_H = 900;
const COL_GAP = 400;
const ROW_GAP = 400;
const COL_W = SCREEN_W + COL_GAP;
const ROW_H = SCREEN_H + ROW_GAP;

const ARROW_COLOR = COLORS.primary;
const LABEL_BG = '#EEF2F7';

// ── Flow Graph Definition ───────────────────────────────────────────

interface FlowPos { col: number; row: number }

const SCREEN_POSITIONS: Record<string, FlowPos> = {
  'login':            { col: 0, row: 0 },
  'dashboard':        { col: 1, row: 0 },
  'public-status':    { col: 3, row: 0 },
  'voc-input':        { col: 0, row: 1 },
  'voc-list':         { col: 1, row: 1 },
  'voc-kanban':       { col: 2, row: 1 },
  'admin-users':      { col: 3, row: 1 },
  'email-compose':    { col: 0, row: 2 },
  'voc-detail':       { col: 1, row: 2 },
  'admin-categories': { col: 3, row: 2 },
};

interface Edge {
  from: string;
  to: string;
  label: string;
}

const EDGES: Edge[] = [
  { from: 'login',       to: 'dashboard',        label: '로그인 성공' },
  { from: 'dashboard',   to: 'voc-input',         label: '새 VOC 등록' },
  { from: 'dashboard',   to: 'voc-list',          label: 'VOC 목록 조회' },
  { from: 'dashboard',   to: 'voc-kanban',        label: '칸반 보드' },
  { from: 'dashboard',   to: 'admin-users',       label: '사용자 관리' },
  { from: 'admin-users', to: 'admin-categories',  label: '카테고리 관리' },
  { from: 'voc-list',    to: 'voc-detail',        label: 'VOC 상세 보기' },
  { from: 'voc-kanban',  to: 'voc-detail',        label: 'VOC 상세 보기' },
  { from: 'voc-detail',  to: 'email-compose',     label: '답변 이메일 작성' },
];

// ── Public API ──────────────────────────────────────────────────────

/**
 * Place screen frames in a user-flow grid with arrow connectors and labels.
 * Design system frames are placed in a row above the flow.
 */
export function placeInFlowLayout(
  dsFrames: FrameNode[],
  screenFrameMap: Map<string, FrameNode[]>,
): void {
  // 1. Place design system frames in a row above the flow
  let dsX = 0;
  const dsY = 0;
  for (const frame of dsFrames) {
    frame.x = dsX;
    frame.y = dsY;
    figma.currentPage.appendChild(frame);
    dsX += frame.width + 200;
  }

  // Flow section title
  const flowOffsetY = dsFrames.length > 0 ? 1600 : 0;

  if (dsFrames.length > 0) {
    const dividerLabel = createText({
      text: '─── User Flow ───',
      size: 24,
      weight: 700,
      color: COLORS.textSecondary,
    });
    dividerLabel.x = 0;
    dividerLabel.y = flowOffsetY - 80;
    figma.currentPage.appendChild(dividerLabel);
  }

  // 2. Place screen frames in the flow grid
  for (const [id, frames] of screenFrameMap) {
    const pos = SCREEN_POSITIONS[id];
    if (!pos) continue;

    let x = pos.col * COL_W;
    const y = flowOffsetY + pos.row * ROW_H;

    for (const frame of frames) {
      frame.x = x;
      frame.y = y;
      figma.currentPage.appendChild(frame);
      x += frame.width + 100;
    }
  }

  // 3. Draw flow connectors
  for (const edge of EDGES) {
    const fromFrames = screenFrameMap.get(edge.from);
    const toFrames = screenFrameMap.get(edge.to);
    if (!fromFrames?.[0] || !toFrames?.[0]) continue;

    drawConnector(fromFrames[0], toFrames[0], edge.label);
  }

  // 4. Add standalone label for public-status if present
  const publicFrames = screenFrameMap.get('public-status');
  if (publicFrames?.[0]) {
    const note = buildAnnotation('독립 접근 (인증 불필요)', COLORS.info);
    note.x = publicFrames[0].x;
    note.y = publicFrames[0].y - 50;
    figma.currentPage.appendChild(note);
  }
}

// ── Connector Drawing ───────────────────────────────────────────────

function drawConnector(from: FrameNode, to: FrameNode, label: string): void {
  const fromCX = from.x + from.width / 2;
  const fromCY = from.y + from.height / 2;
  const toCX = to.x + to.width / 2;

  const isSameRow = Math.abs(from.y - to.y) < 100;
  const isSameCol = Math.abs(from.x - to.x) < 100;
  const isRight = to.x > from.x + from.width * 0.5;
  const isLeft = to.x + to.width < from.x + from.width * 0.5;
  const isBelow = to.y > from.y + from.height * 0.5;

  if (isSameRow) {
    // Horizontal connector
    const y = fromCY;
    const x1 = isRight ? from.x + from.width : from.x;
    const x2 = isRight ? to.x : to.x + to.width;
    hLine(x1, y, x2);
    placeArrow(x2, y, isRight ? 'right' : 'left');
    placeLabel(label, (x1 + x2) / 2, y - 36);
  } else if (isSameCol) {
    // Vertical connector
    const x = fromCX;
    const y1 = from.y + from.height;
    const y2 = to.y;
    vLine(x, y1, y2);
    placeArrow(x, y2, 'down');
    placeLabel(label, x + 16, (y1 + y2) / 2 - 12);
  } else {
    // L-shaped connector: down from "from" → horizontal → down to "to"
    const x1 = fromCX;
    const y1 = from.y + from.height;
    const x2 = toCX;
    const y2 = to.y;
    const midY = y1 + (ROW_GAP * 0.4);

    vLine(x1, y1, midY);            // down from source
    hLine(x1, midY, x2);            // horizontal
    vLine(x2, midY, y2);            // down to target
    placeArrow(x2, y2, 'down');
    placeLabel(label, (x1 + x2) / 2, midY - 36);
  }
}

// ── Drawing Primitives ──────────────────────────────────────────────

function hLine(x1: number, y: number, x2: number): void {
  const rect = figma.createRectangle();
  rect.name = 'Connector';
  rect.resize(Math.abs(x2 - x1), 2);
  rect.x = Math.min(x1, x2);
  rect.y = y - 1;
  rect.fills = [solidPaint(ARROW_COLOR)];
  rect.cornerRadius = 1;
  figma.currentPage.appendChild(rect);
}

function vLine(x: number, y1: number, y2: number): void {
  const rect = figma.createRectangle();
  rect.name = 'Connector';
  rect.resize(2, Math.abs(y2 - y1));
  rect.x = x - 1;
  rect.y = Math.min(y1, y2);
  rect.fills = [solidPaint(ARROW_COLOR)];
  rect.cornerRadius = 1;
  figma.currentPage.appendChild(rect);
}

function placeArrow(x: number, y: number, dir: 'right' | 'down' | 'left' | 'up'): void {
  const chars: Record<string, string> = { right: '▶', down: '▼', left: '◀', up: '▲' };
  const node = figma.createText();
  node.fontName = fontName(400);
  node.fontSize = 12;
  node.characters = chars[dir];
  node.fills = [solidPaint(ARROW_COLOR)];

  switch (dir) {
    case 'right': node.x = x - 2;  node.y = y - 8;  break;
    case 'down':  node.x = x - 7;  node.y = y - 4;  break;
    case 'left':  node.x = x - 12; node.y = y - 8;  break;
    case 'up':    node.x = x - 7;  node.y = y - 16; break;
  }

  figma.currentPage.appendChild(node);
}

function placeLabel(text: string, x: number, y: number): void {
  const badge = createAutoLayoutFrame({
    name: `Flow: ${text}`,
    direction: 'HORIZONTAL',
    padding: { top: 4, right: 12, bottom: 4, left: 12 },
    fill: LABEL_BG,
    cornerRadius: RADIUS.sm,
    stroke: ARROW_COLOR,
  });
  badge.strokeWeight = 1;
  badge.appendChild(createText({ text, size: 13, weight: 600, color: ARROW_COLOR }));
  finalize(badge);

  badge.x = x - 50;
  badge.y = y;
  figma.currentPage.appendChild(badge);
}

function buildAnnotation(text: string, color: string): FrameNode {
  const note = createAutoLayoutFrame({
    name: 'Annotation',
    direction: 'HORIZONTAL',
    padding: { top: 6, right: 14, bottom: 6, left: 14 },
    fill: color + '15',
    cornerRadius: RADIUS.md,
    gap: 6,
  });
  note.appendChild(createText({ text: 'ℹ', size: 14, weight: 600, color }));
  note.appendChild(createText({ text, size: 13, weight: 500, color }));
  finalize(note);
  return note;
}
