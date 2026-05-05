import type { ConnectionStatus, DebugMetrics, SensorTileModel, SparklineDatum } from '@/src/greenhouse/types';
import type { EventListItem } from '@/src/components/organisms/EventList';

export interface UseGreenhouseLiveResult {
  siteName: string;
  connectionStatus: ConnectionStatus;
  summary: string;
  lastSnapshotLabel: string;
  sensors: SensorTileModel[];
  sparkline: { series: SparklineDatum[]; empty: boolean };
  eventItems: EventListItem[];
  debugMetrics: DebugMetrics;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}
