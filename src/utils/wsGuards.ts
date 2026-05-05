import type { ApiWsMessage } from '@/src/greenhouse/apiTypes';

export function isWsMessage(x: unknown): x is ApiWsMessage {
  if (!x || typeof x !== 'object') return false;
  const t = (x as { type?: unknown }).type;
  return t === 'reading_delta' || t === 'anomaly_event';
}
