import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { EventTileSeverity } from '@/src/components/molecules/EventTile';
import { EventTile } from '@/src/components/molecules/EventTile';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { cardChrome, spacing } from '@/src/styles/view-styles';

export interface EventListItem {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  type: string;
  value: string | number;
  timestamp?: string;
  subtitle?: string;
  severity?: EventTileSeverity;
}

export const eventListDummyItems: EventListItem[] = [
  {
    id: '1',
    iconName: 'pulse-outline',
    type: 'CO₂',
    value: '940 ppm',
    timestamp: '14:02',
    subtitle: 'Spike vs baseline',
    severity: 'warning',
  },
  {
    id: '2',
    iconName: 'water-outline',
    type: 'Humidity',
    value: '38%',
    timestamp: '13:54',
    subtitle: 'Dip zone B',
    severity: 'neutral',
  },
  {
    id: '3',
    iconName: 'thermometer-outline',
    type: 'Temperature',
    value: '24.9°C',
    timestamp: '13:41',
    subtitle: 'MAD outlier',
    severity: 'critical',
  },
];

export interface EventListProps {
  colors: ThemePalette;
  items?: EventListItem[];
  /** Section title (defaults to Recent Events). */
  title?: string;
}

export const EventList = memo(function EventList({
  colors,
  items = [],
  title = 'Recent Events',
}: EventListProps) {
  const countLabel = `${items.length} event${items.length !== 1 ? 's' : ''}`;

  return (
    <View style={[cardChrome(colors), styles.sectionPad]}>
      <View style={styles.headerRow}>
        <View style={styles.iconSlot}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.warning} accessibilityElementsHidden />
        </View>
        <Text
          style={[textScale.sm, { fontWeight: '600', color: colors.foreground, flex: 1, minWidth: 0 }]}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[textScale.xs, styles.headerTrailing, { color: colors.mutedForeground }]}
        >
          {countLabel}
        </Text>
      </View>

      {items.length === 0 ? (
        <Text
          accessibilityRole="text"
          style={[textScale.sm, styles.empty, { color: colors.mutedForeground }]}
          numberOfLines={3}
        >
          No events
        </Text>
      ) : (
        <View style={styles.stack}>
          {items.map((item) => (
            <EventTile
              key={item.id}
              colors={colors}
              iconName={item.iconName}
              type={item.type}
              value={item.value}
              timestamp={item.timestamp}
              subtitle={item.subtitle}
              severity={item.severity}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  sectionPad: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'nowrap',
  },
  iconSlot: { justifyContent: 'center' },
  headerTrailing: { marginLeft: 'auto' },
  empty: {
    textAlign: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  stack: { gap: spacing.sm },
});
