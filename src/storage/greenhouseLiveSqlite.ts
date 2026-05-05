import type { SQLiteDatabase } from 'expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';

import { EVENT_CAP, HISTORY_CAP } from '@/src/config/greenhouseLive';
import type {
  ApiAnomaly,
  ApiHistoryPoint,
  ApiRanges,
  ApiReading,
  ApiSeverity,
  ApiSnapshot,
} from '@/src/greenhouse/apiTypes';

const DB_NAME = 'greenhouse.db';

/** Serialized queue for live event writes (matches history write serialization). */
let eventWriteChain: Promise<void> = Promise.resolve();

/** Serialized queue for websocket-driven history writes (prevents overlapping BEGIN on the same connection). */
let historyWriteChain: Promise<void> = Promise.resolve();

async function runGreenhouseLiveWriteTxn(
  db: SQLiteDatabase,
  work: (conn: SQLiteDatabase) => Promise<void>,
): Promise<void> {
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(async () => work(db));
    return;
  }
  await db.withExclusiveTransactionAsync(work);
}

async function ensureSchema(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sensor_ranges (
      metric TEXT PRIMARY KEY NOT NULL,
      min REAL NOT NULL,
      max REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS history (
      seq INTEGER PRIMARY KEY NOT NULL,
      ts TEXT NOT NULL,
      temp REAL NOT NULL,
      humid REAL NOT NULL,
      co2 REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY NOT NULL,
      event_seq INTEGER NOT NULL,
      ts TEXT NOT NULL,
      sensor TEXT NOT NULL,
      level TEXT NOT NULL,
      value REAL NOT NULL,
      reason TEXT NOT NULL,
      message TEXT NOT NULL
    );
  `);
}

/** Open DB and ensure tables exist. */
export async function openGreenhouseLiveDb(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DB_NAME);
  await ensureSchema(db);
  return db;
}

export async function resetGreenhouseLiveData(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM sensor_ranges');
  await db.runAsync('DELETE FROM history');
  await db.runAsync('DELETE FROM events');
}

export async function upsertRanges(db: SQLiteDatabase, ranges: ApiRanges): Promise<void> {
  const rows: [string, number, number][] = [
    ['temperature', ranges.temperature.min, ranges.temperature.max],
    ['humidity', ranges.humidity.min, ranges.humidity.max],
    ['co2', ranges.co2.min, ranges.co2.max],
  ];
  await runGreenhouseLiveWriteTxn(db, async (conn) => {
    for (const [metric, min, max] of rows) {
      await conn.runAsync(
        `INSERT OR REPLACE INTO sensor_ranges (metric, min, max) VALUES (?, ?, ?)`,
        [metric, min, max],
      );
    }
  });
}

/** Insert one history row then keep only the newest HISTORY_CAP rows by seq. */
export async function upsertHistoryRow(
  db: SQLiteDatabase,
  seq: number,
  ts: string,
  reading: ApiReading,
): Promise<void> {
  const job = historyWriteChain.then(async () =>
    runGreenhouseLiveWriteTxn(db, async (conn) => {
      await conn.runAsync(
        `INSERT OR REPLACE INTO history (seq, ts, temp, humid, co2) VALUES (?, ?, ?, ?, ?)`,
        [seq, ts, reading.temperature, reading.humidity, reading.co2],
      );
      await conn.runAsync(
        `DELETE FROM history WHERE seq NOT IN (
          SELECT seq FROM (
            SELECT seq FROM history ORDER BY seq DESC LIMIT ?
          )
        )`,
        [HISTORY_CAP],
      );
    }),
  );
  historyWriteChain = job.catch(() => {});
  await job;
}

export async function bulkSeedHistory(db: SQLiteDatabase, points: ApiHistoryPoint[]): Promise<void> {
  await runGreenhouseLiveWriteTxn(db, async (conn) => {
    for (const p of points) {
      await conn.runAsync(
        `INSERT OR REPLACE INTO history (seq, ts, temp, humid, co2) VALUES (?, ?, ?, ?, ?)`,
        [p.seq, p.timestamp, p.reading.temperature, p.reading.humidity, p.reading.co2],
      );
    }
    await conn.runAsync(
      `DELETE FROM history WHERE seq NOT IN (
        SELECT seq FROM (
          SELECT seq FROM history ORDER BY seq DESC LIMIT ?
        )
      )`,
      [HISTORY_CAP],
    );
  });
}

export async function seedEventsFromSnapshot(db: SQLiteDatabase, anomalies: ApiAnomaly[]): Promise<void> {
  await runGreenhouseLiveWriteTxn(db, async (conn) => {
    const top = [...anomalies].sort((a, b) => b.seq - a.seq).slice(0, EVENT_CAP);
    for (const a of top) {
      await conn.runAsync(
        `INSERT OR REPLACE INTO events (id, event_seq, ts, sensor, level, value, reason, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.seq, a.timestamp, a.sensor, a.level, a.value, a.reason, a.message],
      );
    }
  });
}

/** Insert or update one anomaly row, then keep only the newest EVENT_CAP rows by event_seq. */
export async function upsertEventRow(db: SQLiteDatabase, a: ApiAnomaly): Promise<void> {
  const job = eventWriteChain.then(async () =>
    runGreenhouseLiveWriteTxn(db, async (conn) => {
      await conn.runAsync(
        `INSERT OR REPLACE INTO events (id, event_seq, ts, sensor, level, value, reason, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.seq, a.timestamp, a.sensor, a.level, a.value, a.reason, a.message],
      );
      await conn.runAsync(
        `DELETE FROM events WHERE id NOT IN (
          SELECT id FROM (
            SELECT id FROM events ORDER BY event_seq DESC, id DESC LIMIT ?
          )
        )`,
        [EVENT_CAP],
      );
    }),
  );
  eventWriteChain = job.catch(() => {});
  await job;
}

export async function getEventsDescending(db: SQLiteDatabase): Promise<ApiAnomaly[]> {
  const rows = await db.getAllAsync<{
    id: string;
    event_seq: number;
    ts: string;
    sensor: string;
    level: string;
    value: number;
    reason: string;
    message: string;
  }>(
    `SELECT id, event_seq, ts, sensor, level, value, reason, message FROM events ORDER BY event_seq DESC, id DESC LIMIT ?`,
    [EVENT_CAP],
  );
  return rows.map((r) => ({
    id: r.id,
    seq: r.event_seq,
    timestamp: r.ts,
    sensor: r.sensor,
    level: r.level as ApiSeverity,
    value: r.value,
    reason: r.reason,
    message: r.message,
  }));
}

/** Replace chart history + thresholds from an HTTP snapshot without clearing the events table (reconnect heal). */
export async function replaceHistoryWithSnapshot(db: SQLiteDatabase, snap: ApiSnapshot): Promise<void> {
  await upsertRanges(db, snap.ranges);
  await runGreenhouseLiveWriteTxn(db, async (conn) => {
    await conn.runAsync('DELETE FROM history');
  });
  await bulkSeedHistory(db, snap.history);
}

export async function seedFromSnapshot(db: SQLiteDatabase, snap: ApiSnapshot): Promise<void> {
  await resetGreenhouseLiveData(db);
  await upsertRanges(db, snap.ranges);
  await bulkSeedHistory(db, snap.history);
  await seedEventsFromSnapshot(db, snap.anomalies);
}

export type HistoryRow = { seq: number; ts: string; temp: number; humid: number; co2: number };

export async function getHistoryAsc(db: SQLiteDatabase): Promise<HistoryRow[]> {
  return db.getAllAsync<HistoryRow>(
    `SELECT seq, ts, temp, humid, co2 FROM history ORDER BY seq ASC`,
  );
}

export async function getRangesMap(db: SQLiteDatabase): Promise<ApiRanges | null> {
  const rows = await db.getAllAsync<{ metric: string; min: number; max: number }>(
    `SELECT metric, min, max FROM sensor_ranges`,
  );
  const t = rows.find((r) => r.metric === 'temperature');
  const h = rows.find((r) => r.metric === 'humidity');
  const c = rows.find((r) => r.metric === 'co2');
  if (!t || !h || !c) return null;
  return {
    temperature: { min: t.min, max: t.max },
    humidity: { min: h.min, max: h.max },
    co2: { min: c.min, max: c.max },
  };
}
