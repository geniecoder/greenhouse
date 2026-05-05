import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { SensorTileModel } from '@/src/greenhouse/types';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { layout, sensorTileChrome, spacing } from '@/src/styles/view-styles';

const ALERT_ICON_SIZE = 14;

export interface SensorTileProps {
  model: SensorTileModel;
  colors: ThemePalette;
  iconName: keyof typeof Ionicons.glyphMap;
  unit: string;
  style?: StyleProp<ViewStyle>;
}

function formatValue(unit: string, value: number | null): string {
  if (value === null) return '—';
  if (unit === 'ppm') return Math.round(value).toString();
  if (unit === '%') return Math.round(value).toString();
  return value.toFixed(1);
}

function tierFromVariant(model: SensorTileModel): 'nominal' | 'warning' | 'error' | 'empty' {
  switch (model.variant) {
    case 'empty':
      return 'empty';
    case 'error':
      return 'error';
    case 'alert':
      return 'warning';
    default:
      return 'nominal';
  }
}

function leadingIconColor(model: SensorTileModel, colors: ThemePalette): string {
  const tier = tierFromVariant(model);
  return tier === 'empty' ? colors.mutedForeground : colors.primary;
}

export const SensorTile = memo(function SensorTile({
  model,
  colors,
  iconName,
  unit,
  style,
}: SensorTileProps) {
  const a11yRole: 'alert' | undefined =
    model.variant === 'alert' || model.variant === 'error' ? 'alert' : undefined;

  const tier = tierFromVariant(model);

  const trackFill = useMemo(() => {
    if (tier === 'error') return colors.destructive;
    if (tier === 'warning') return colors.warning;
    return colors.success;
  }, [colors, tier]);

  const pct = useMemo(() => {
    if (model.value === null) return 0;
    const { min, max } = model.thresholds;
    const span = max - min || 1;
    return Math.max(0, Math.min(100, ((model.value - min) / span) * 100));
  }, [model]);

  const chrome = sensorTileChrome(colors, tier);

  const a11yText =
    model.value === null
      ? (model.helperText ?? 'No reading')
      : `${formatValue(unit, model.value)} ${unit}; range ${model.thresholds.min}–${model.thresholds.max}${unit === 'ppm' || unit === '%' ? ' ' + unit : ''}`;

  const iconBg = tier === 'empty' ? colors.muted : colors.secondary;

  return (
    <View
      {...(a11yRole ? { accessibilityRole: a11yRole } : {})}
      accessibilityLabel={model.label}
      accessibilityValue={{ text: a11yText }}
      accessibilityHint={model.helperText || undefined}
      style={[chrome, styles.inner, style]}
    >
      <View style={styles.headRow}>
        <View style={styles.labelRow}>
          <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
            <Ionicons
              name={iconName}
              size={18}
              color={leadingIconColor(model, colors)}
              accessibilityElementsHidden
            />
          </View>
          <Text style={[textScale.sm, { color: colors.mutedForeground }]}>{model.label}</Text>
        </View>
        <View style={styles.alertSlot}>
          {(model.variant === 'alert' || model.variant === 'error') && (
            <Ionicons
              name="warning-outline"
              size={ALERT_ICON_SIZE}
              color={model.variant === 'error' ? colors.destructive : colors.warning}
              accessibilityRole="image"
              accessibilityLabel="Threshold exceeded"
            />
          )}
        </View>
      </View>

      <View style={styles.readingRow}>
        <Text style={[textScale.display, { fontSize: 30, fontWeight: '700', color: colors.foreground }]}>
          {model.value === null ? '—' : formatValue(unit, model.value)}
        </Text>
        {model.value !== null ? (
          <Text style={[textScale.sm, { color: colors.mutedForeground, marginLeft: spacing.xs }]}>{unit}</Text>
        ) : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.trackBg, { backgroundColor: colors.muted }]} accessible accessibilityRole="progressbar">
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: trackFill }]} />
        </View>
        <View style={styles.rangeLabels}>
          <Text style={[textScale.xs, { color: colors.mutedForeground }]}>
            {model.thresholds.min}
            {unit}
          </Text>
          <Text style={[textScale.xs, { color: colors.mutedForeground }]}>
            {model.thresholds.max}
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  inner: { padding: spacing.lg, gap: spacing.md },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
  /** Keeps tile height stable whether or not alert icon shows */
  alertSlot: {
    width: ALERT_ICON_SIZE + 4,
    height: ALERT_ICON_SIZE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    padding: 8,
    borderRadius: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingRow: { flexDirection: 'row', alignItems: 'baseline' },
  track: { gap: 6, width: '100%' },
  trackBg: { height: 8, borderRadius: layout.minTouchTarget, overflow: 'hidden' },
  fill: { height: '100%' },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
});
