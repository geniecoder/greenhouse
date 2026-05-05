import { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { spacing } from '@/src/styles/view-styles';

export interface MetricCellProps {
  colors: ThemePalette;
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}


export const MetricCell = memo(function MetricCell({
  colors,
  label,
  value,
  style,
}: MetricCellProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[textScale.xs, styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[textScale.mono, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm,
    minWidth: 0,
    width: '47%',
    flexGrow: 1,
  },
  label: { marginBottom: 4 },
});
