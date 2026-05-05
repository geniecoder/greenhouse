import { Ionicons } from '@expo/vector-icons';

import type {
  ApiAnomaly,
  ApiReading,
  ApiRanges,
  ApiSeverity,
  ApiSnapshot,
} from '@/src/greenhouse/apiTypes';
import type { EventListItem } from '@/src/components/organisms/EventList';
import type { SensorTileModel, SensorTileVariant } from '@/src/greenhouse/types';

/** Map LIVE / reconnecting strings to dashboard connection enum */
export function apiStatusToConnection(status: string | null | undefined): 'live' | 'reconnecting' | 'offline' {
  if (!status) return 'offline';
  const s = status.toUpperCase();
  if (s === 'LIVE') return 'live';
  if (s === 'RECONNECTING') return 'reconnecting';
  return 'offline';
}

/** Display label for greenhouse id slug */
export function prettifyGreenhouseId(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' · ');
}

function formatTime12hAmPmFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatClockFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = `${d.getHours()}`.padStart(2, '0');
  const mm = `${d.getMinutes()}`.padStart(2, '0');
  const ss = `${d.getSeconds()}`.padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** @param _recalcEpoch — bump when wall time advances without a new ISO snapshot (refreshes label after “just now”). */
export function formatLastUpdateLabel(iso: string, _recalcEpoch?: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `Updated ${iso}`;
  const secs = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (secs <= 5) return 'Last update just now';
  return `Last update ${formatTime12hAmPmFromIso(iso)}`;
}

function withinRange(val: number, min: number, max: number): boolean {
  return val >= min && val <= max;
}

function metricVariant(val: number, range: { min: number; max: number }): SensorTileVariant {
  return withinRange(val, range.min, range.max) ? 'nominal' : 'alert';
}

/** Build three sensor tiles from a reading + thresholds (used for SQLite cache hydration). */
export function readingToSensorModels(reading: ApiReading, ranges: ApiRanges): SensorTileModel[] {
  const tempVar = metricVariant(reading.temperature, ranges.temperature);
  const humidVar = metricVariant(reading.humidity, ranges.humidity);
  const co2Var = metricVariant(reading.co2, ranges.co2);

  return [
    {
      id: 'temp',
      label: 'Temperature',
      unit: '°C',
      value: reading.temperature,
      thresholds: ranges.temperature,
      variant: tempVar,
      helperText: tempVar === 'alert' ? 'Outside advisory band' : undefined,
    },
    {
      id: 'humidity',
      label: 'Humidity',
      unit: '%',
      value: reading.humidity,
      thresholds: ranges.humidity,
      variant: humidVar,
      helperText: humidVar === 'alert' ? 'Outside advisory band' : undefined,
    },
    {
      id: 'co2',
      label: 'CO₂',
      unit: 'ppm',
      value: Math.round(reading.co2),
      thresholds: ranges.co2,
      variant: co2Var,
      helperText: co2Var === 'alert' ? 'Outside advisory band' : undefined,
    },
  ];
}

/** Build three sensors from snapshot current + thresholds */
export function snapshotToSensorModels(snap: ApiSnapshot): SensorTileModel[] {
  return readingToSensorModels(snap.current, snap.ranges);
}

/** Update current readings from delta while keeping ranges from existing models */
export function applyReadingToSensors(
  sensors: SensorTileModel[],
  reading: ApiReading,
  ranges: ApiRanges,
): SensorTileModel[] {
  const byId = Object.fromEntries(sensors.map((s) => [s.id, s])) as Record<string, SensorTileModel>;

  const tempVar = metricVariant(reading.temperature, ranges.temperature);
  const humidVar = metricVariant(reading.humidity, ranges.humidity);
  const co2Var = metricVariant(reading.co2, ranges.co2);

  return [
    {
      ...(byId.temp ?? { id: 'temp', label: 'Temperature', unit: '°C' }),
      value: reading.temperature,
      thresholds: ranges.temperature,
      variant: tempVar,
      helperText: tempVar === 'alert' ? 'Outside advisory band' : undefined,
    },
    {
      ...(byId.humidity ?? { id: 'humidity', label: 'Humidity', unit: '%' }),
      value: reading.humidity,
      thresholds: ranges.humidity,
      variant: humidVar,
      helperText: humidVar === 'alert' ? 'Outside advisory band' : undefined,
    },
    {
      ...(byId.co2 ?? { id: 'co2', label: 'CO₂', unit: 'ppm' }),
      value: Math.round(reading.co2),
      thresholds: ranges.co2,
      variant: co2Var,
      helperText: co2Var === 'alert' ? 'Outside advisory band' : undefined,
    },
  ];
}

function sensorLabelApi(s: string): string {
  if (s === 'co2') return 'CO₂';
  if (s === 'humidity') return 'Humidity';
  return 'Temperature';
}

function sensorIconApi(s: string): keyof typeof Ionicons.glyphMap {
  if (s === 'humidity') return 'water-outline';
  if (s === 'co2') return 'pulse-outline';
  return 'thermometer-outline';
}

function severityForEvent(level: ApiSeverity): 'warning' | 'critical' {
  return level === 'critical' ? 'critical' : 'warning';
}

function formatEventValue(sensor: string, value: number): string {
  if (sensor === 'co2') return `${Math.round(value)} ppm`;
  if (sensor === 'humidity') return `${value.toFixed(1)} %`;
  return `${value.toFixed(1)}°C`;
}

export function anomalyToEventTileItem(row: ApiAnomaly): EventListItem {
  const detail = row.message?.trim() || row.reason?.trim() || '';
  return {
    id: row.id,
    iconName: sensorIconApi(row.sensor),
    type: sensorLabelApi(row.sensor),
    value: formatEventValue(row.sensor, row.value),
    subtitle: detail || undefined,
    timestamp: formatClockFromIso(row.timestamp),
    severity: severityForEvent(row.level) === 'critical' ? 'critical' : 'warning',
  };
}

/** WS anomaly envelope may use snake sensor same as REST */
export function wsPayloadEventToAnomaly(evt: {
  id: string;
  seq: number;
  timestamp: string;
  sensor: string;
  level: ApiSeverity;
  value: number;
  reason: string;
  message: string;
}): ApiAnomaly {
  return {
    id: evt.id,
    seq: evt.seq,
    timestamp: evt.timestamp,
    sensor: evt.sensor,
    level: evt.level,
    value: evt.value,
    reason: evt.reason,
    message: evt.message,
  };
}

export function anomaliesToItems(rows: ApiAnomaly[]): EventListItem[] {
  const sorted = [...rows].sort((a, b) => b.seq - a.seq);
  return sorted.map(anomalyToEventTileItem);
}
