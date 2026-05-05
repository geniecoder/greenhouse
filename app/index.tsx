import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '@/src/components/molecules/Header';
import { SensorTile } from '@/src/components/molecules/SensorTile';
import { SparklineCard } from '@/src/components/molecules/SparklineCard';
import { DebugPanel } from '@/src/components/organisms/DebugPanel';
import { EventList } from '@/src/components/organisms/EventList';
import { PhotoFab } from '@/src/components/organisms/PhotoFab';
import { greenhouseDummy } from '@/src/fixtures/greenhouseDummy';
import { layout, screenPaddingBottom, spacing } from '@/src/styles/view-styles';
import { useAppTheme } from '@/src/ui/useAppTheme';

const TELEMETRY_WS_URL = 'ws://192.168.1.140:5050/ws';

export default function GreenhouseScreen() {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const data = greenhouseDummy;

  const fabBottom = Math.max(insets.bottom, spacing.lg) + spacing.md;
  const padBottom = screenPaddingBottom(fabBottom);

  const temp = data.sensors.find((s) => s.id === 'temp');
  const humidity = data.sensors.find((s) => s.id === 'humidity');
  const co2 = data.sensors.find((s) => s.id === 'co2');

  useEffect(() => {
    const ws = new WebSocket(TELEMETRY_WS_URL);

    ws.onopen = () => {
      console.log('Connected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string);
        console.log(parsed);
      } catch {
        console.warn('WebSocket message is not valid JSON:', event.data);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.viewport, { backgroundColor: colors.background }]}>
          <ScrollView
            style={[styles.scroll, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: padBottom }]}
            keyboardShouldPersistTaps="handled"
          >
            <Header
              facilityName={data.siteName}
              connectionStatus={data.connectionStatus}
              lastSnapshotLabel={data.lastSnapshotLabel}
              summary={data.summary}
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
                title={`${data.sparkline.sensorLabel} · Last 14 minutes`}
                unit="°C"
                empty={data.sparkline.empty}
                series={data.sparkline.series}
                colors={colors}
              />
              
              <EventList colors={colors} />

              <DebugPanel metrics={data.debug} colors={colors} />
            </View>
          </ScrollView>
          <PhotoFab
            colors={colors}
            pendingCount={data.pendingPhotoUploads}
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
