import type {
  ConnectionStatus,
  GreenhouseDashboardFixture,
  SensorTileVariant,
  SparklineDatum,
} from '@/src/greenhouse/types';

const now = Date.now();

function tempSeries(): SparklineDatum[] {
  const base = 22.8;
  return Array.from({ length: 15 }, (_, i) => ({
    t: now - (14 - i) * 60_000,
    value: base + Math.sin(i / 3) * 1.4 + i * 0.02,
  }));
}

/** Flip return value to `'reconnecting'` | `'offline'` when testing */
function demoConnection(): ConnectionStatus {
  return 'live';
}

const DEMO_CONNECTION = demoConnection();

function tileVariant(sensorId: string): SensorTileVariant {
  switch (sensorId) {
    case 'co2':
      return DEMO_CONNECTION === 'live' ? 'alert' : 'nominal';
    case 'humidity':
      return 'nominal';
    default:
      return DEMO_CONNECTION === 'offline' ? 'empty' : 'nominal';
  }
}

/** Phase 1 static bundle wired into the greenhouse dashboard screen. */
export const greenhouseDummy: GreenhouseDashboardFixture = {
  siteName: 'North Glasshouse • Block A',
  connectionStatus: DEMO_CONNECTION,
  lastSnapshotLabel: 'Last update 12s ago',
  summary:
    DEMO_CONNECTION === 'live'
      ? 'CO₂ above comfort band — airflow check suggested'
      : DEMO_CONNECTION === 'reconnecting'
        ? 'Reconnecting to live data… readings may be stale'
        : 'Offline — caching locally; uploads queued',
  sensors: [
    {
      id: 'temp',
      label: 'Temperature',
      unit: '°C',
      value: DEMO_CONNECTION === 'offline' ? null : 23.4,
      thresholds: { min: 18, max: 28 },
      variant: DEMO_CONNECTION === 'offline' ? 'empty' : tileVariant('temp'),
      helperText: DEMO_CONNECTION === 'offline' ? 'Waiting for readings' : undefined,
    },
    {
      id: 'humidity',
      label: 'Humidity',
      unit: '%',
      value: DEMO_CONNECTION === 'offline' ? null : 64,
      thresholds: { min: 45, max: 75 },
      variant: DEMO_CONNECTION === 'offline' ? 'empty' : tileVariant('humidity'),
      helperText: DEMO_CONNECTION === 'offline' ? 'Snapshot required' : undefined,
    },
    {
      id: 'co2',
      label: 'CO₂',
      unit: 'ppm',
      value: DEMO_CONNECTION === 'offline' ? null : 1080,
      thresholds: { min: 350, max: 900 },
      variant: DEMO_CONNECTION === 'offline' ? 'empty' : tileVariant('co2'),
      helperText:
        DEMO_CONNECTION === 'offline'
          ? 'Connect to ingest live ppm'
          : 'Above advisory max (900 ppm)',
    },
  ],
  sparkline: {
    title: 'Temperature • last 14 min',
    sensorLabel: 'Temperature',
    empty: DEMO_CONNECTION === 'offline',
    series: tempSeries(),
  },
  anomalies: [
    {
      id: '1',
      timestampLabel: '14:02:41',
      reason: 'CO₂ spike z=3.4',
      sensor: 'co2',
      severity: 'warning',
    },
    {
      id: '2',
      timestampLabel: '13:54:06',
      reason: 'Humidity dip z=-2.1',
      sensor: 'humidity',
      severity: 'warning',
    },
    {
      id: '3',
      timestampLabel: '13:41:52',
      reason: 'Rolling temp MAD outlier',
      sensor: 'temperature',
      severity: 'critical',
    },
    {
      id: '4',
      timestampLabel: '13:38:09',
      reason: 'EWMA deviation (temp)',
      sensor: 'temperature',
      severity: 'warning',
    },
  ],
  pendingPhotoUploads: 2,
  debug: {
    lastEventAgeMs: 1240,
    eventsPerSecEma: 2.74,
    reconnectCount: 1,
    sequence: 44821,
    version: 3,
    duplicateCount: 12,
    gapCount: 1,
  },
};
