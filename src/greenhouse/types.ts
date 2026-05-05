export type ConnectionStatus = 'live' | 'reconnecting' | 'offline';

export type SensorTileVariant = 'empty' | 'error' | 'nominal' | 'alert';

export interface ThresholdRange {
  min: number;
  max: number;
}


export interface SensorTileModel {
  id: string;
  label: string;
  unit: string;
  value: number | null;
  thresholds: ThresholdRange;
  variant: SensorTileVariant;
  helperText?: string;
}

export interface SparklineDatum {
  t: number;
  value: number;
}

export interface SparklineFixture {
  title: string;
  sensorLabel: string;
  empty: boolean;
  series: SparklineDatum[];
}

export interface AnomalyListItem {
  id: string;
  timestampLabel: string;
  reason: string;
  severity?: 'warning' | 'critical';
  sensor?: 'temperature' | 'humidity' | 'co2';
}

export interface DebugMetrics {
  lastEventAgeMs: number;
  eventsPerSecEma: number;
  reconnectCount: number;
  sequence: number;
  version: number;
  duplicateCount: number;
  gapCount: number;
}


export interface GreenhouseDashboardFixture {
  siteName: string;
  connectionStatus: ConnectionStatus;
  lastSnapshotLabel: string;
  summary: string;
  sensors: SensorTileModel[];
  sparkline: SparklineFixture;
  anomalies: AnomalyListItem[];
  pendingPhotoUploads: number;
  debug: DebugMetrics;
}
