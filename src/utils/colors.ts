export interface ColorOption {
  hex: string;
  label: string;
}

/**
 * Curated palette — 3 rows of 5, grouped by hue family.
 * Values are hex so they work identically with both preset swatches
 * and custom colors from the native picker.
 */
export const COLOR_PALETTE: ColorOption[][] = [
  // Cool greens → blues
  [
    { hex: '#34d399', label: 'Mint' },
    { hex: '#10b981', label: 'Emerald' },
    { hex: '#14b8a6', label: 'Teal' },
    { hex: '#06b6d4', label: 'Cyan' },
    { hex: '#0ea5e9', label: 'Sky' },
  ],
  // Blues → purples
  [
    { hex: '#3b82f6', label: 'Blue' },
    { hex: '#6366f1', label: 'Indigo' },
    { hex: '#8b5cf6', label: 'Violet' },
    { hex: '#a855f7', label: 'Purple' },
    { hex: '#d946ef', label: 'Fuchsia' },
  ],
  // Warm colors
  [
    { hex: '#ec4899', label: 'Pink' },
    { hex: '#f43f5e', label: 'Rose' },
    { hex: '#ef4444', label: 'Red' },
    { hex: '#f97316', label: 'Orange' },
    { hex: '#f59e0b', label: 'Amber' },
  ],
];

export const ALL_COLORS: ColorOption[] = COLOR_PALETTE.flat();
export const DEFAULT_COLOR = '#10b981';

export function getColorLabel(hex: string): string {
  const found = ALL_COLORS.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase()
  );
  return found?.label ?? 'Custom';
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** Returns '#ffffff' or '#111827' for the best contrast on the given hex. */
export function getContrastColor(hex: string): string {
  if (!isValidHex(hex)) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 0.65 ? '#111827' : '#ffffff';
}

/** Soft background tint for chips/badges — same hex at 15% alpha. */
export function hexToSoftBg(hex: string): string {
  if (!isValidHex(hex)) return 'rgba(156, 163, 175, 0.15)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}