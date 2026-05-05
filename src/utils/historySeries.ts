import type { SparklineDatum } from '@/src/greenhouse/types';
import type { HistoryRow } from '@/src/storage/greenhouseLiveSqlite';

export function historyRowsToTempSeries(rows: HistoryRow[]): SparklineDatum[] {
  return rows.map((r) => ({
    t: Date.parse(r.ts),
    value: r.temp,
  }));
}
