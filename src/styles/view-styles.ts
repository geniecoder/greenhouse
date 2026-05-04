import type { ThemePalette } from '@/src/styles/colors';

function tintFromHex(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Layout margins and spacing */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** radius cards and views */
export const radii = {
  sm: 8,
  md: 12,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const layout = {
  minTouchTarget: 44,
  contentMaxWidth: 672,
} as const;

export function screenPaddingBottom(fabInset: number) {
  return 96 + fabInset;
}

export function cardChrome(colors: ThemePalette) {
  return {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
  } as const;
}

/** Sensor tile styles for different state */
export function sensorTileChrome(colors: ThemePalette, tier: 'nominal' | 'warning' | 'error' | 'empty') {
  if (tier === 'empty') {
    return {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderWidth: 2,
      borderRadius: radii.md,
    };
  }
  if (tier === 'error') {
    return {
      backgroundColor: tintFromHex(colors.destructive, 0.06),
      borderColor: colors.destructive,
      borderWidth: 2,
      borderRadius: radii.md,
    };
  }
  if (tier === 'warning') {
    return {
      backgroundColor: tintFromHex(colors.warning, 0.08),
      borderColor: colors.warning,
      borderWidth: 2,
      borderRadius: radii.md,
    };
  }
  return {
    backgroundColor: colors.card,
    borderColor: colors.success,
    borderWidth: 2,
    borderRadius: radii.md,
  };
}

export function anomalyRowChrome(colors: ThemePalette, severity: 'warning' | 'critical') {
  if (severity === 'critical') {
    return {
      borderColor: colors.destructive,
      backgroundColor: tintFromHex(colors.destructive, 0.06),
      borderWidth: 1,
      borderRadius: radii.sm,
    };
  }
  return {
    borderColor: colors.warning,
    backgroundColor: tintFromHex(colors.warning, 0.08),
    borderWidth: 1,
    borderRadius: radii.sm,
  };
}
