import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card, CardContent } from '@/src/components/molecules/Card';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { spacing } from '@/src/styles/view-styles';

export type EventTileSeverity = 'neutral' | 'warning' | 'critical';

export interface EventTileProps {
  colors: ThemePalette;
  iconName: keyof typeof Ionicons.glyphMap;
  type: string;
  value: string | number;
  /** Shown on the trailing end of the row (e.g. `14:02:41`). */
  timestamp?: string;
  subtitle?: string;
  severity?: EventTileSeverity;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

function displayValue(value: string | number): string {
  return typeof value === 'number' ? String(value) : value;
}

const LINE_FONT_SIZE = textScale.sm.fontSize;
const LINE_LINE_HEIGHT = textScale.sm.lineHeight;

export const EventTile = memo(function EventTile({
  colors,
  iconName,
  type,
  value,
  timestamp,
  subtitle,
  severity = 'neutral',
  iconColor,
  style,
}: EventTileProps) {
  const resolvedIconColor = useMemo(() => {
    if (iconColor) return iconColor;
    if (severity === 'critical') return colors.destructive;
    if (severity === 'warning') return colors.warning;
    return colors.mutedForeground;
  }, [colors.destructive, colors.mutedForeground, colors.warning, iconColor, severity]);

  const severityBorderColor = useMemo(() => {
    if (severity === 'critical') return colors.destructive;
    if (severity === 'warning') return colors.warning;
    return colors.border;
  }, [colors.border, colors.destructive, colors.warning, severity]);

  const lineTextBase = useMemo(
    () => ({
      fontSize: LINE_FONT_SIZE,
      lineHeight: LINE_LINE_HEIGHT,
      fontWeight: '400' as const,
    }),
    [],
  );

  const a11yLabel = [type, displayValue(value), subtitle, timestamp].filter(Boolean).join('. ');

  return (
    <Card
      colors={colors}
      paddingHorizontal={spacing.lg}
      paddingVertical={spacing.sm}
      style={[{ borderColor: severityBorderColor }, style]}
      accessibilityLabel={a11yLabel}
    >
      <CardContent>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Ionicons name={iconName} size={18} color={resolvedIconColor} accessibilityElementsHidden />
          </View>

          <View style={styles.textRow}>
            <Text
              style={[lineTextBase, styles.typePiece, { color: colors.mutedForeground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {type}
            </Text>
            <Text
              style={[lineTextBase, styles.valuePiece, { color: colors.foreground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayValue(value)}
            </Text>
            {subtitle ? (
              <Text
                style={[lineTextBase, styles.subPiece, { color: colors.mutedForeground }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {timestamp ? (
            <Text
              style={[lineTextBase, styles.timestampPiece, { color: colors.mutedForeground }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {timestamp}
            </Text>
          ) : null}
        </View>
      </CardContent>
    </Card>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  typePiece: {
    flexShrink: 1,
    minWidth: 0,
  },
  valuePiece: {
    flexShrink: 1,
    minWidth: 40,
  },
  subPiece: {
    flexShrink: 1,
    minWidth: 0,
  },
  timestampPiece: {
    flexShrink: 0,
    textAlign: 'right',
  },
});
