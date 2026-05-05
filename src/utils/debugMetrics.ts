import type { DebugMetrics } from '@/src/greenhouse/types';

export function createInitialLiveDebugMetrics(): DebugMetrics {
  return {
    lastEventAgeMs: 0,
    eventsPerSecEma: 0,
    reconnectCount: 0,
    sequence: 0,
    version: 0,
    duplicateCount: 0,
    gapCount: 0,
  };
}
