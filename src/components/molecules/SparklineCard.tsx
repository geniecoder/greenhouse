import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SparklineDatum } from '@/src/greenhouse/types';
import type { ThemePalette } from '@/src/styles/colors';
import { textScale } from '@/src/styles/text-styles';
import { cardChrome, spacing } from '@/src/styles/view-styles';
import Sparkline from './Sparkline';

export interface SparklineCardProps {
  title: string;
  unit: string;
  empty: boolean;
  series: SparklineDatum[];
  colors: ThemePalette;
}

export const SparklineCard = memo(function SparklineCard({
  title,
  unit,
  empty,
  series,
  colors,
}: SparklineCardProps) {
  const values = useMemo(
    () =>
      series.length > 0
        ? [...series].sort((a, b) => a.t - b.t).map((d) => d.value)
        : [],
    [series],
  );

  const lastVal =
    !empty && series.length > 0 ? series[series.length - 1].value.toFixed(1) : '—';

  return (
    <View style={[cardChrome(colors), styles.sectionPad]}>
      <View style={styles.headerRow}>
        <Text style={[textScale.sm, { fontWeight: '600', color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[textScale.xs, { color: colors.mutedForeground }]}>
          {lastVal}
          {unit}
        </Text>
      </View>
      <View style={styles.chartBlock}>
        {empty || values.length === 0 ? (
          <Text style={[textScale.sm, { color: colors.mutedForeground, textAlign: 'center' }]}>
            Not enough samples for the chart
          </Text>
        ) : (
          <Sparkline data={values} unit=" °C" />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionPad: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  chartBlock: { paddingTop: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
