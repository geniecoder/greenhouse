import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MetricCell } from '@/src/components/molecules/MetricCell';
import type { DebugMetrics } from '@/src/greenhouse/types';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { spacing } from '@/src/styles/view-styles';

export interface DebugPanelProps {
  metrics: DebugMetrics;
  colors: ThemePalette;
  initiallyExpanded?: boolean;
}

export const DebugPanel = memo(function DebugPanel({
  metrics,
  colors,
  initiallyExpanded = false,
}: DebugPanelProps) {
  const [open, setOpen] = useState(initiallyExpanded);
  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }, []);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.mutedPanel, borderColor: colors.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Collapse debug panel' : 'Expand debug panel'}
        accessibilityState={{ expanded: open }}
        accessibilityHint="Transport and ordering diagnostics."
        hitSlop={8}
        onPress={toggle}
        style={({ pressed }) => [styles.toggle, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.toggleLeft}>
          <Ionicons name="pulse-outline" size={18} color={colors.mutedForeground} />
          <Text style={[textScale.sm, { fontWeight: '600', color: colors.foreground }]}>Debug Panel</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.foreground} />
      </Pressable>
      {open ? (
        <View style={[styles.grid, { borderTopColor: colors.border }]}>
          <MetricCell colors={colors} label="Last Event Age" value={`${metrics.lastEventAgeMs} ms`} style={styles.metricSlot} />
          <MetricCell colors={colors} label="Events/sec (EMA)" value={metrics.eventsPerSecEma.toFixed(2)} style={styles.metricSlot} />
          <MetricCell colors={colors} label="Reconnect Count" value={`${metrics.reconnectCount}`} style={styles.metricSlot} />
          <MetricCell colors={colors} label="Sequence #" value={`${metrics.sequence}`} style={styles.metricSlot} />
          <MetricCell colors={colors} label="Duplicates" value={`${metrics.duplicateCount}`} style={styles.metricSlot} />
          <MetricCell colors={colors} label="Version" value={`${metrics.version}`} style={styles.metricSlot} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metricSlot: {
    width: '47%',
    flexGrow: 1,
  },
});
