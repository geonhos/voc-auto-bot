import { COLORS, STATUS_COLORS, PRIORITY_COLORS, CHART_PALETTE, SPACING } from '../utils/constants';
import { hexToRgb, solidPaint, createAutoLayoutFrame, createText, fontName, finalize } from '../utils/helpers';

/** Create PaintStyles and a visual Color Palette page */
export async function generateColors(): Promise<FrameNode[]> {
  // ── Create PaintStyles ────────────────────────────────────────────
  const allColors: Record<string, string> = {
    // Core
    'Primary': COLORS.primary,
    'Primary Light': COLORS.primaryLight,
    'Primary Dark': COLORS.primaryDark,
    // Background
    'BG Light': COLORS.bgLight,
    'BG Dark': COLORS.bgDark,
    'Surface Light': COLORS.surfaceLight,
    'Surface Dark': COLORS.surfaceDark,
    // Border
    'Border Light': COLORS.borderLight,
    'Border Dark': COLORS.borderDark,
    // Text
    'Text Primary': COLORS.textPrimary,
    'Text Secondary': COLORS.textSecondary,
    'Text Muted': COLORS.textMuted,
    'Text On Primary': COLORS.textOnPrimary,
    // Semantic
    'Success': COLORS.success,
    'Warning': COLORS.warning,
    'Danger': COLORS.danger,
    'Info': COLORS.info,
  };

  // Add status colors
  for (const [status, { bg, text }] of Object.entries(STATUS_COLORS)) {
    allColors[`Status/${status}/bg`] = bg;
    allColors[`Status/${status}/text`] = text;
  }

  // Add priority colors
  for (const [priority, hex] of Object.entries(PRIORITY_COLORS)) {
    allColors[`Priority/${priority}`] = hex;
  }

  // Create PaintStyles
  for (const [name, hex] of Object.entries(allColors)) {
    const style = figma.createPaintStyle();
    style.name = `VOC/${name}`;
    style.paints = [solidPaint(hex)];
  }

  // ── Visual Color Palette Frame ────────────────────────────────────
  const root = createAutoLayoutFrame({
    name: 'Color Palette',
    direction: 'VERTICAL',
    padding: 48,
    gap: 48,
  });

  // Title
  const title = createText({ text: 'Color Palette', size: 30, weight: 700 });
  root.appendChild(title);

  // Section: Core Colors
  root.appendChild(buildColorSection('Core Colors', {
    'Primary': COLORS.primary,
    'Primary Light': COLORS.primaryLight,
    'Primary Dark': COLORS.primaryDark,
    'White': COLORS.white,
    'BG Light': COLORS.bgLight,
    'Border Light': COLORS.borderLight,
  }));

  // Section: Semantic Colors
  root.appendChild(buildColorSection('Semantic Colors', {
    'Success': COLORS.success,
    'Warning': COLORS.warning,
    'Danger': COLORS.danger,
    'Info': COLORS.info,
  }));

  // Section: Text Colors
  root.appendChild(buildColorSection('Text Colors', {
    'Primary': COLORS.textPrimary,
    'Secondary': COLORS.textSecondary,
    'Muted': COLORS.textMuted,
    'On Primary': COLORS.textOnPrimary,
  }));

  // Section: Status Badge Colors
  const statusSection = createAutoLayoutFrame({ name: 'Status Badge Colors', direction: 'VERTICAL', gap: 16 });
  statusSection.appendChild(createText({ text: 'Status Badge Colors', size: 20, weight: 600 }));
  const statusRow = createAutoLayoutFrame({ name: 'Status Row', direction: 'HORIZONTAL', gap: 16 });
  for (const [status, { bg, text }] of Object.entries(STATUS_COLORS)) {
    const badge = createAutoLayoutFrame({
      name: status,
      direction: 'HORIZONTAL',
      padding: { top: 4, right: 12, bottom: 4, left: 12 },
      fill: bg,
      cornerRadius: 9999,
    });
    badge.appendChild(createText({ text: status.toUpperCase(), size: 14, weight: 600, color: text }));
    statusRow.appendChild(badge);
  }
  statusSection.appendChild(statusRow);
  root.appendChild(statusSection);

  // Section: Priority Colors
  const prioritySection = createAutoLayoutFrame({ name: 'Priority Colors', direction: 'VERTICAL', gap: 16 });
  prioritySection.appendChild(createText({ text: 'Priority Colors', size: 20, weight: 600 }));
  const priorityRow = createAutoLayoutFrame({ name: 'Priority Row', direction: 'HORIZONTAL', gap: 16 });
  for (const [priority, hex] of Object.entries(PRIORITY_COLORS)) {
    const badge = createAutoLayoutFrame({
      name: priority,
      direction: 'HORIZONTAL',
      padding: { top: 4, right: 12, bottom: 4, left: 12 },
      fill: hex,
      cornerRadius: SPACING.sm,
    });
    badge.appendChild(createText({ text: priority, size: 13, weight: 600, color: '#ffffff' }));
    priorityRow.appendChild(badge);
  }
  prioritySection.appendChild(priorityRow);
  root.appendChild(prioritySection);

  // Section: Chart Palette
  const chartSection = createAutoLayoutFrame({ name: 'Chart Palette', direction: 'VERTICAL', gap: 16 });
  chartSection.appendChild(createText({ text: 'Chart Palette', size: 20, weight: 600 }));
  const chartRow = createAutoLayoutFrame({ name: 'Chart Row', direction: 'HORIZONTAL', gap: 8 });
  for (const hex of CHART_PALETTE) {
    const swatch = figma.createRectangle();
    swatch.name = hex;
    swatch.resize(48, 48);
    swatch.fills = [solidPaint(hex)];
    swatch.cornerRadius = 6;
    chartRow.appendChild(swatch);
  }
  chartSection.appendChild(chartRow);
  root.appendChild(chartSection);

  finalize(root);
  return [root];
}

function buildColorSection(title: string, colors: Record<string, string>): FrameNode {
  const section = createAutoLayoutFrame({ name: title, direction: 'VERTICAL', gap: 16 });
  section.appendChild(createText({ text: title, size: 20, weight: 600 }));

  const row = createAutoLayoutFrame({ name: `${title} Row`, direction: 'HORIZONTAL', gap: 16 });

  for (const [name, hex] of Object.entries(colors)) {
    const card = createAutoLayoutFrame({
      name,
      direction: 'VERTICAL',
      gap: 8,
      width: 120,
    });

    const swatch = figma.createRectangle();
    swatch.name = 'Swatch';
    swatch.resize(120, 80);
    swatch.fills = [solidPaint(hex)];
    swatch.cornerRadius = 8;
    card.appendChild(swatch);

    card.appendChild(createText({ text: name, size: 13, weight: 600 }));
    card.appendChild(createText({ text: hex.toUpperCase(), size: 12, color: COLORS.textSecondary }));

    row.appendChild(card);
  }

  section.appendChild(row);
  return section;
}
