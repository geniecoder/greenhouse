import { memo, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/src/components/atoms/StatusPill';
import type { ConnectionStatus } from '@/src/greenhouse/types';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { spacing } from '@/src/styles/view-styles';

export interface HeaderProps {
  brandTitle?: string;
  facilityName: string;
  connectionStatus: ConnectionStatus;
  lastSnapshotLabel: string;
  summary: string;
  colors: ThemePalette;
}

/** Compact header strip (~40% shorter than original): tight padding, smaller type, merged meta */
export const Header = memo(function Header({
  brandTitle = 'Greenhouse Guard',
  facilityName,
  connectionStatus,
  lastSnapshotLabel,
  summary,
  colors,
}: HeaderProps) {
  const metaFg = `${colors.primaryForeground}E6`;

  const statusLine = useMemo(
    () => `${lastSnapshotLabel}${summary ? ` · ${summary}` : ''}`.trim(),
    [lastSnapshotLabel, summary],
  );

  return (
    <View
      style={[
        styles.strip,
        {
          backgroundColor: colors.primary,
          shadowColor: '#000104',
          ...Platform.select({ ios: { shadowOpacity: 0.12 }, default: {} }),
          elevation: Platform.OS === 'android' ? 4 : undefined,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleColumn}>
          <Text
            accessibilityRole="header"
            style={[styles.brand, { color: colors.primaryForeground }]}
            numberOfLines={1}
          >
            {brandTitle}
          </Text>
          {facilityName ? (
            <Text style={[styles.facility, { color: metaFg }]} numberOfLines={1}>
              {facilityName}
            </Text>
          ) : null}
        </View>
        <StatusPill status={connectionStatus} colors={colors} compact />
      </View>
      <Text style={[styles.statusLine, { color: metaFg }]} numberOfLines={2}>
        {statusLine}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.sm + 2,
    gap: spacing.xs / 2 + 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleColumn: { flex: 1, gap: 2, minWidth: 0 },
  brand: {
    ...textScale.lg,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  facility: {
    ...textScale.xs,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    opacity: 0.92,
  },
  statusLine: {
    ...textScale.xs,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    opacity: 0.88,
  },
});
