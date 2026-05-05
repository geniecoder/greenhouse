/** Wire types for greenhouse backend snapshot + WS payloads */

export interface ApiReading {
  temperature: number;
  humidity: number;
  co2: number;
}

export interface ApiRange {
  min: number;
  max: number;
}

export interface ApiRanges {
  temperature: ApiRange;
  humidity: ApiRange;
  co2: ApiRange;
}

export interface ApiHistoryPoint {
  seq: number;
  timestamp: string;
  reading: ApiReading;
}

export type ApiSeverity = 'warning' | 'critical';

export interface ApiAnomalyEventBody {
  id: string;
  seq: number;
  timestamp: string;
  sensor: string;
  level: ApiSeverity;
  value: number;
  reason: string;
  message: string;
}

export interface ApiAnomaly {
  id: string;
  seq: number;
  timestamp: string;
  sensor: string;
  level: ApiSeverity;
  value: number;
  reason: string;
  message: string;
}

export interface ApiSnapshot {
  type: 'snapshot';
  seq: number;
  version: number;
  timestamp: string;
  greenhouseId: string;
  status: string;
  summary: string;
  current: ApiReading;
  history: ApiHistoryPoint[];
  anomalies: ApiAnomaly[];
  ranges: ApiRanges;
}

/** WebSocket payloads (union by `type`). */
export interface ApiWsReadingDelta {
  type: 'reading_delta';
  greenhouseId: string;
  seq: number;
  version: number;
  timestamp: string;
  status: string | null;
  summary: string | null;
  reading: ApiReading;
  event: ApiAnomalyEventBody | null;
}

export interface ApiWsAnomalyEvent {
  type: 'anomaly_event';
  greenhouseId: string;
  seq: number;
  version: number;
  timestamp: string;
  status: string | null;
  summary: string | null;
  reading: ApiReading;
  event: ApiAnomalyEventBody | null;
}

export type ApiWsMessage = ApiWsReadingDelta | ApiWsAnomalyEvent;

export function isSnapshotJson(x: unknown): x is ApiSnapshot {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return o.type === 'snapshot';
}
