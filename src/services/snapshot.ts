import { SNAPSHOT_URL } from '@/src/config/greenhouseLive';
import { type ApiSnapshot, isSnapshotJson } from '@/src/greenhouse/apiTypes';

export async function fetchSnapshot(): Promise<ApiSnapshot> {
  const res = await fetch(SNAPSHOT_URL);
  if (!res.ok) {
    throw new Error(`Snapshot HTTP ${res.status}: ${res.statusText}`);
  }
  const json: unknown = await res.json();
  if (!isSnapshotJson(json)) {
    throw new Error('Snapshot JSON missing type "snapshot"');
  }
  return json;
}
