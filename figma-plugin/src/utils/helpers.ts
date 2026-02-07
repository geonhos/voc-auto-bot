import { FONT_FAMILY, FONT_FALLBACK, COLORS, RADIUS } from './constants';

// ── Deferred FILL Sizing ────────────────────────────────────────────
// layoutSizingHorizontal/Vertical = 'FILL' can only be set AFTER a node
// is appended to an auto-layout parent. We defer and apply via finalize().

const _deferredFills = new WeakMap<SceneNode, { h?: boolean; v?: boolean }>();

function deferFill(node: SceneNode, axis: 'h' | 'v'): void {
  const existing = _deferredFills.get(node) || {};
  existing[axis] = true;
  _deferredFills.set(node, existing);
}

/** Mark a node to receive layoutSizingHorizontal = 'FILL' when finalize() runs */
export function markFillH(node: SceneNode): void { deferFill(node, 'h'); }

/** Mark a node to receive layoutSizingVertical = 'FILL' when finalize() runs */
export function markFillV(node: SceneNode): void { deferFill(node, 'v'); }

/** Walk the tree and apply all deferred FILL sizing. Call after tree is fully assembled. */
export function finalize(root: FrameNode): void {
  for (const child of root.children) {
    const d = _deferredFills.get(child);
    if (d) {
      if (d.h) (child as any).layoutSizingHorizontal = 'FILL';
      if (d.v) (child as any).layoutSizingVertical = 'FILL';
      _deferredFills.delete(child);
    }
    if ('children' in child) {
      finalize(child as FrameNode);
    }
  }
}

// ── Color Utilities ─────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

export function solidPaint(hex: string): SolidPaint {
  return { type: 'SOLID', color: hexToRgb(hex) };
}

// ── Font Loading ────────────────────────────────────────────────────

let resolvedFont = FONT_FAMILY;

export async function loadFonts(): Promise<void> {
  const weights: FontName['style'][] = ['Regular', 'Medium', 'Semi Bold', 'Bold'];
  try {
    for (const style of weights) {
      await figma.loadFontAsync({ family: FONT_FAMILY, style });
    }
    resolvedFont = FONT_FAMILY;
  } catch {
    for (const style of weights) {
      await figma.loadFontAsync({ family: FONT_FALLBACK, style });
    }
    resolvedFont = FONT_FALLBACK;
  }
}

export function fontName(weight: number): FontName {
  const styleMap: Record<number, FontName['style']> = {
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
  };
  return { family: resolvedFont, style: styleMap[weight] || 'Regular' };
}

// ── Node Builders ───────────────────────────────────────────────────

export interface AutoLayoutOpts {
  name: string;
  direction?: 'HORIZONTAL' | 'VERTICAL';
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  gap?: number;
  width?: number | 'FILL' | 'HUG';
  height?: number | 'FILL' | 'HUG';
  fill?: string;
  cornerRadius?: number;
  stroke?: string;
  strokeWeight?: number;
}

export function createAutoLayoutFrame(opts: AutoLayoutOpts): FrameNode {
  const frame = figma.createFrame();
  frame.name = opts.name;
  frame.layoutMode = opts.direction || 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';

  // Padding
  if (typeof opts.padding === 'number') {
    frame.paddingTop = opts.padding;
    frame.paddingRight = opts.padding;
    frame.paddingBottom = opts.padding;
    frame.paddingLeft = opts.padding;
  } else if (opts.padding) {
    frame.paddingTop = opts.padding.top ?? 0;
    frame.paddingRight = opts.padding.right ?? 0;
    frame.paddingBottom = opts.padding.bottom ?? 0;
    frame.paddingLeft = opts.padding.left ?? 0;
  }

  frame.itemSpacing = opts.gap ?? 0;

  // Size
  if (opts.width === 'FILL') {
    deferFill(frame, 'h');
  } else if (opts.width === 'HUG') {
    frame.layoutSizingHorizontal = 'HUG';
  } else if (typeof opts.width === 'number') {
    frame.layoutSizingHorizontal = 'FIXED';
    frame.resize(opts.width, frame.height);
  }

  if (opts.height === 'FILL') {
    deferFill(frame, 'v');
  } else if (opts.height === 'HUG') {
    frame.layoutSizingVertical = 'HUG';
  } else if (typeof opts.height === 'number') {
    frame.layoutSizingVertical = 'FIXED';
    frame.resize(frame.width, opts.height);
  }

  // Fill
  if (opts.fill) {
    frame.fills = [solidPaint(opts.fill)];
  } else {
    frame.fills = [];
  }

  // Corner radius
  if (opts.cornerRadius !== undefined) {
    frame.cornerRadius = opts.cornerRadius;
  }

  // Stroke
  if (opts.stroke) {
    frame.strokes = [solidPaint(opts.stroke)];
    frame.strokeWeight = opts.strokeWeight ?? 1;
  }

  return frame;
}

export interface TextOpts {
  text: string;
  size?: number;
  weight?: number;
  color?: string;
  width?: number | 'FILL';
}

export function createText(opts: TextOpts): TextNode {
  const node = figma.createText();
  node.fontName = fontName(opts.weight ?? 400);
  node.fontSize = opts.size ?? 14;
  node.characters = opts.text;
  node.fills = [solidPaint(opts.color ?? COLORS.textPrimary)];

  if (opts.width === 'FILL') {
    deferFill(node, 'h');
  } else if (typeof opts.width === 'number') {
    node.resize(opts.width, node.height);
    node.textAutoResize = 'HEIGHT';
  }

  return node;
}

/** Gray placeholder rectangle (for charts, images, icons) */
export function createPlaceholder(
  name: string,
  width: number,
  height: number,
  color?: string,
): RectangleNode {
  const rect = figma.createRectangle();
  rect.name = name;
  rect.resize(width, height);
  rect.fills = [solidPaint(color ?? '#e0e0e0')];
  rect.cornerRadius = RADIUS.md;
  return rect;
}

// ── App Shell Builder (shared across most screens) ──────────────────

export function buildAppShell(pageName: string): {
  root: FrameNode;
  sidebar: FrameNode;
  mainArea: FrameNode;
  content: FrameNode;
} {
  const root = createAutoLayoutFrame({
    name: pageName,
    direction: 'HORIZONTAL',
    width: 1440,
    height: 900,
    fill: COLORS.bgLight,
  });

  // Sidebar
  const sidebar = createAutoLayoutFrame({
    name: 'Sidebar',
    direction: 'VERTICAL',
    width: 240,
    height: 'FILL',
    fill: COLORS.primaryDark,
    padding: { top: 16, right: 12, bottom: 16, left: 12 },
    gap: 4,
  });

  const logo = createText({ text: 'VOC Auto Bot', size: 18, weight: 700, color: COLORS.white });
  sidebar.appendChild(logo);

  const divider = createAutoLayoutFrame({ name: 'Divider', direction: 'HORIZONTAL', width: 'FILL', height: 1, fill: '#4a5568' });
  sidebar.appendChild(divider);

  const navItems = ['Dashboard', 'VOC 입력', 'VOC 목록', 'VOC 칸반', 'VOC 상세', '이메일 작성', '관리: 사용자', '관리: 카테고리', '공개 조회'];
  for (const item of navItems) {
    const navItem = createAutoLayoutFrame({
      name: `Nav - ${item}`,
      direction: 'HORIZONTAL',
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
      gap: 8,
      width: 'FILL',
      cornerRadius: RADIUS.md,
    });
    const icon = createPlaceholder('Icon', 20, 20, '#8a9db3');
    const label = createText({ text: item, size: 14, weight: 400, color: '#d1d5db' });
    navItem.appendChild(icon);
    navItem.appendChild(label);
    sidebar.appendChild(navItem);
  }

  root.appendChild(sidebar);

  // Main area (header + content)
  const mainArea = createAutoLayoutFrame({
    name: 'Main Area',
    direction: 'VERTICAL',
    width: 'FILL',
    height: 'FILL',
  });

  // Header
  const header = createAutoLayoutFrame({
    name: 'Header',
    direction: 'HORIZONTAL',
    width: 'FILL',
    height: 56,
    fill: COLORS.surfaceLight,
    padding: { top: 0, right: 24, bottom: 0, left: 24 },
    gap: 12,
    stroke: COLORS.borderLight,
  });
  header.counterAxisAlignItems = 'CENTER';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';

  const breadcrumb = createText({ text: pageName, size: 16, weight: 600, color: COLORS.textPrimary });
  header.appendChild(breadcrumb);

  const headerRight = createAutoLayoutFrame({ name: 'Header Right', direction: 'HORIZONTAL', gap: 12 });
  headerRight.counterAxisAlignItems = 'CENTER';
  const searchBox = createAutoLayoutFrame({
    name: 'Search',
    direction: 'HORIZONTAL',
    width: 200,
    height: 32,
    fill: COLORS.bgLight,
    cornerRadius: RADIUS.md,
    padding: { top: 6, right: 12, bottom: 6, left: 12 },
  });
  const searchText = createText({ text: '검색...', size: 13, color: COLORS.textMuted });
  searchBox.appendChild(searchText);
  headerRight.appendChild(searchBox);

  const avatar = createPlaceholder('Avatar', 32, 32, COLORS.primaryLight);
  avatar.cornerRadius = 9999;
  headerRight.appendChild(avatar);
  header.appendChild(headerRight);

  mainArea.appendChild(header);

  // Content
  const content = createAutoLayoutFrame({
    name: 'Content',
    direction: 'VERTICAL',
    width: 'FILL',
    height: 'FILL',
    padding: 24,
    gap: 24,
  });

  mainArea.appendChild(content);
  root.appendChild(mainArea);

  return { root, sidebar, mainArea, content };
}
