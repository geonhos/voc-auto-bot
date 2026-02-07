// Design tokens extracted from frontend (tailwind.config.ts, globals.css)

// ── Colors ──────────────────────────────────────────────────────────

export const COLORS = {
  // Primary
  primary: '#556780',
  primaryLight: '#8a9db3',
  primaryDark: '#2d3745',

  // Background / Surface
  bgLight: '#f5f5f4',
  bgDark: '#1c1917',
  surfaceLight: '#ffffff',
  surfaceDark: '#2d3745',

  // Border
  borderLight: '#e7e5e4',
  borderDark: '#373330',

  // Text
  textPrimary: '#1c1917',
  textSecondary: '#78716c',
  textMuted: '#a8a29e',
  textOnPrimary: '#f0f4f8',

  // Semantic
  success: '#6b8e6b',
  warning: '#b38f4d',
  danger: '#a16060',
  info: '#5b8a8a',

  // Pure
  white: '#ffffff',
  black: '#000000',
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  received:   { bg: '#e7e5e4', text: '#44403c' },
  analyzing:  { bg: '#dde8f0', text: '#3a5068' },
  processing: { bg: '#f0e8d9', text: '#7d6333' },
  completed:  { bg: '#e1e9e0', text: '#475c47' },
  failed:     { bg: '#ebe2e0', text: '#704040' },
  rejected:   { bg: '#ebe2e0', text: '#704040' },
} as const;

export const PRIORITY_COLORS: Record<string, string> = {
  LOW:    '#7C8590',
  NORMAL: '#5878A0',
  HIGH:   '#B89350',
  URGENT: '#B85C5C',
} as const;

export const CHART_PALETTE = [
  '#556780', '#6b8e6b', '#b38f4d', '#5b8a8a', '#a16060',
  '#8a9db3', '#475569', '#78716c', '#2d3745', '#44403c',
] as const;

// ── Typography ──────────────────────────────────────────────────────

export const FONT_FAMILY = 'Inter';
export const FONT_FALLBACK = 'Roboto';

export interface TypoToken {
  name: string;
  size: number;
  weight: number;       // 400 | 500 | 600 | 700
  lineHeight: number;   // px
  letterSpacing?: number;
}

export const TYPOGRAPHY: TypoToken[] = [
  { name: 'Display',    size: 30, weight: 700, lineHeight: 36 },
  { name: 'Heading 1',  size: 24, weight: 700, lineHeight: 32 },
  { name: 'Heading 2',  size: 20, weight: 600, lineHeight: 28 },
  { name: 'Heading 3',  size: 18, weight: 600, lineHeight: 24 },
  { name: 'Body Large', size: 16, weight: 400, lineHeight: 24 },
  { name: 'Body',       size: 14, weight: 400, lineHeight: 20 },
  { name: 'Body Medium',size: 14, weight: 500, lineHeight: 20 },
  { name: 'Body Bold',  size: 14, weight: 600, lineHeight: 20 },
  { name: 'Caption',    size: 12, weight: 400, lineHeight: 16 },
  { name: 'Overline',   size: 12, weight: 600, lineHeight: 16, letterSpacing: 0.5 },
];

// ── Spacing / Radius ────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  full: 9999,
} as const;

// ── Layout ──────────────────────────────────────────────────────────

export const SCREEN_WIDTH = 1440;
export const SIDEBAR_WIDTH = 240;
export const CONTENT_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH;
export const HEADER_HEIGHT = 56;
