import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/src/components/molecules/Header';
import { SensorTile } from '@/src/components/molecules/SensorTile';
import { SparklineCard } from '@/src/components/molecules/SparklineCard';
import { DebugPanel } from '@/src/components/organisms/DebugPanel';
import { EventList } from '@/src/components/organisms/EventList';
import { PhotoFab } from '@/src/components/organisms/PhotoFab';
import { useGreenhouseLive } from '@/src/hooks/useGreenhouseLive';
import { textScale } from '@/src/styles/text-styles';
import { layout, screenPaddingBottom, spacing } from '@/src/styles/view-styles';
import { useAppTheme } from '@/src/ui/useAppTheme';

function stripNominalBoilerplate(summary: string): string {
  const raw = summary.trim();
  if (!raw) return '';
  if (/^all sensors operating normally\.?$/i.test(raw)) return '';
  return raw
    .replace(/\s*[·•]\s*all sensors operating normally\.?/gi, '')
    .replace(/all sensors operating normally\.?\s*[·•]\s*/gi, '')
    .replace(/\s*,\s*all sensors operating normally\.?/gi, '')
    .trim();
}

export default function GreenhouseScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const live = useGreenhouseLive();

  const fabBottom = Math.max(insets.bottom, spacing.lg) + spacing.md;
  const padBottom = screenPaddingBottom(fabBottom);

  const temp = live.sensors.find((s) => s.id === 'temp');
  const humidity = live.sensors.find((s) => s.id === 'humidity');
  const co2 = live.sensors.find((s) => s.id === 'co2');

  const dashboardSensors = live.sensors;

  const { headerSummary, headerSensorAdvisory } = useMemo(() => {
    const eventItems = live.eventItems;
    const latestEventLine = eventItems[0]?.subtitle?.trim() ?? '';

    const allEmpty =
      dashboardSensors.length === 0 || dashboardSensors.every((s) => s.variant === 'empty');
    const allNominal =
      dashboardSensors.length > 0 && dashboardSensors.every((s) => s.variant === 'nominal');
    const hasTileAlert = dashboardSensors.some((s) => s.variant === 'alert' || s.variant === 'error');

    const rawSummary = live.summary.trim();

    // Live tile state wins over historic events: when every reading is nominal, don't surface last event in the header.
    if (allNominal && !allEmpty) {
      return {
        headerSummary: rawSummary || 'All sensors operating normally',
        headerSensorAdvisory: undefined,
      };
    }

    if (eventItems.length > 0 && latestEventLine.length > 0) {
      return { headerSummary: latestEventLine, headerSensorAdvisory: undefined };
    }

    if (eventItems.length > 0 && rawSummary.length > 0) {
      return { headerSummary: stripNominalBoilerplate(rawSummary), headerSensorAdvisory: undefined };
    }

    if (eventItems.length > 0) {
      const latest = eventItems[0];
      const fallback = `${latest.type} ${latest.value}`.trim();
      if (fallback.length > 0) {
        return { headerSummary: fallback, headerSensorAdvisory: undefined };
      }
    }

    if (hasTileAlert && eventItems.length === 0) {
      const advisory =
        dashboardSensors.find((s) => (s.variant === 'alert' || s.variant === 'error') && s.helperText)?.helperText ??
        'Outside advisory band';
      return {
        headerSummary: rawSummary,
        headerSensorAdvisory: rawSummary.length > 0 ? undefined : advisory,
      };
    }

    return { headerSummary: rawSummary, headerSensorAdvisory: undefined };
  }, [live.eventItems, live.summary, dashboardSensors]);

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.viewport, { backgroundColor: colors.background }]}>
          {live.error ? (
            <View style={[styles.errorBanner, { borderColor: colors.destructive }]}>
              <Text style={[textScale.sm, { color: colors.foreground, flex: 1 }]}>
                {live.error.message}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading live data"
                onPress={live.retry}
                style={({ pressed }) => [styles.retryBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={[textScale.sm, { color: colors.primary, fontWeight: '600' }]}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {live.loading && live.sensors.length === 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}

          <ScrollView
            style={[styles.scroll, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: padBottom }]}
            keyboardShouldPersistTaps="handled"
          >
            <Header
              facilityName={live.siteName}
              connectionStatus={live.connectionStatus}
              lastSnapshotLabel={live.lastSnapshotLabel}
              summary={headerSummary}
              sensorAdvisory={headerSensorAdvisory}
              colors={colors}
            />
            <View style={[styles.mainColumn, { maxWidth: layout.contentMaxWidth }]}>
              <View style={styles.tileRow}>
                {temp ? (
                  <SensorTile
                    model={temp}
                    colors={colors}
                    style={styles.tileHalf}
                    iconName="thermometer-outline"
                    unit="°C"
                  />
                ) : null}
                {humidity ? (
                  <SensorTile
                    model={humidity}
                    colors={colors}
                    style={styles.tileHalf}
                    iconName="water-outline"
                    unit="%"
                  />
                ) : null}
              </View>
              {co2 ? (
                <SensorTile
                  model={co2}
                  colors={colors}
                  style={styles.tileFull}
                  iconName="pulse-outline"
                  unit="ppm"
                />
              ) : null}

              <SparklineCard
                title="Temperature · recent"
                unit="°C"
                empty={live.sparkline.empty}
                series={live.sparkline.series}
                colors={colors}
              />

              <EventList colors={colors} items={live.eventItems} />

              <DebugPanel metrics={live.debugMetrics} colors={colors} />
            </View>
          </ScrollView>
          <PhotoFab
            colors={colors}
            pendingCount={0}
            bottomOffset={fabBottom}
            onPress={() => undefined}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  safe: { flex: 1 },
  viewport: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  loader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  mainColumn: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  tileRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  tileHalf: {
    flex: 1,
    minWidth: 0,
  },
  tileFull: {
    alignSelf: 'stretch',
  },
});
