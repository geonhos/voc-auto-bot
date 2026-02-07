import { TYPOGRAPHY, COLORS } from '../utils/constants';
import { hexToRgb, solidPaint, createAutoLayoutFrame, createText, fontName, finalize } from '../utils/helpers';

/** Create TextStyles and a visual Typography Scale page */
export async function generateTypography(): Promise<FrameNode[]> {
  // ── Create TextStyles ─────────────────────────────────────────────
  for (const t of TYPOGRAPHY) {
    const style = figma.createTextStyle();
    style.name = `VOC/${t.name}`;
    style.fontName = fontName(t.weight);
    style.fontSize = t.size;
    style.lineHeight = { value: t.lineHeight, unit: 'PIXELS' };
    if (t.letterSpacing) {
      style.letterSpacing = { value: t.letterSpacing, unit: 'PIXELS' };
    }
  }

  // ── Visual Typography Scale ───────────────────────────────────────
  const root = createAutoLayoutFrame({
    name: 'Typography Scale',
    direction: 'VERTICAL',
    padding: 48,
    gap: 32,
  });

  const title = createText({ text: 'Typography Scale', size: 30, weight: 700 });
  root.appendChild(title);

  const subtitle = createText({
    text: 'Font Family: Inter  |  Weights: Regular (400), Medium (500), Semi Bold (600), Bold (700)',
    size: 14,
    color: COLORS.textSecondary,
  });
  root.appendChild(subtitle);

  // Each typography token as a row
  for (const t of TYPOGRAPHY) {
    const row = createAutoLayoutFrame({
      name: t.name,
      direction: 'HORIZONTAL',
      gap: 24,
      width: 800,
    });
    row.counterAxisAlignItems = 'CENTER';

    // Meta info column
    const meta = createAutoLayoutFrame({ name: 'Meta', direction: 'VERTICAL', gap: 2, width: 160 });
    meta.appendChild(createText({ text: t.name, size: 12, weight: 600, color: COLORS.primary }));
    meta.appendChild(createText({
      text: `${t.size}px / ${t.lineHeight}px / ${t.weight}`,
      size: 11,
      color: COLORS.textMuted,
    }));
    row.appendChild(meta);

    // Sample text
    const sample = createText({
      text: 'VOC Auto Bot 고객의 소리 자동 분류 시스템',
      size: t.size,
      weight: t.weight,
      width: 'FILL',
    });
    row.appendChild(sample);

    root.appendChild(row);
  }

  finalize(root);
  return [root];
}
