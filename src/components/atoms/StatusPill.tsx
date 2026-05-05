import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import type { ConnectionStatus } from '@/src/greenhouse/types';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { layout, spacing } from '@/src/styles/view-styles';

export interface StatusPillProps {
  status: ConnectionStatus;
  colors: ThemePalette;
  compact?: boolean;
}

const LABELS: Record<ConnectionStatus, string> = {
  live: 'LIVE',
  reconnecting: 'RECONNECTING',
  offline: 'OFFLINE',
};

export const StatusPill = memo(function StatusPill({ status, colors, compact }: StatusPillProps) {
  const tone = useMemo(() => {
    switch (status) {
      case 'live':
        return {
          bg: colors.success,
          fg: colors.successForeground,
          icon: 'cloud' as keyof typeof Ionicons.glyphMap,
        };
      case 'reconnecting':
        return {
          bg: colors.warning,
          fg: colors.warningForeground,
          icon: 'refresh' as keyof typeof Ionicons.glyphMap,
        };
      default:
        return {
          bg: colors.destructive,
          fg: colors.destructiveForeground,
          icon: 'cloud-off-outline' as keyof typeof Ionicons.glyphMap,
        };
    }
  }, [colors, status]);

  return (
    <View
      accessibilityRole={Platform.OS === 'ios' ? 'text' : 'none'}
      accessibilityLabel={`Connection status ${LABELS[status]}`}
      accessibilityLiveRegion="polite"
      style={[compact ? styles.pillCompact : styles.pill, { backgroundColor: tone.bg }]}
    >
      <Ionicons name={tone.icon} size={compact ? 13 : 16} color={tone.fg} accessibilityElementsHidden />
      <Text style={[textScale.xs, compact ? styles.pillTextCompact : styles.pillText, { color: tone.fg }]}>
        {LABELS[status]}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    minHeight: layout.minTouchTarget / 2,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: layout.minTouchTarget,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pillCompact: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs / 2 + 1,
    borderRadius: spacing.lg,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs / 2 + 1,
  },
  pillText: { fontWeight: '600', letterSpacing: 0.5 },
  pillTextCompact: { fontWeight: '700', letterSpacing: 0.4, fontSize: 10, lineHeight: 12 },
});
