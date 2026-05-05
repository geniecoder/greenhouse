import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { EventListItem } from '@/src/components/organisms/EventList';
import { EMA_ALPHA, WS_URL } from '@/src/config/greenhouseLive';
import type { ApiRanges, ApiSnapshot, ApiWsMessage } from '@/src/greenhouse/apiTypes';
import {
  anomaliesToItems,
  apiStatusToConnection,
  applyReadingToSensors,
  formatLastUpdateLabel,
  prettifyGreenhouseId,
  readingToSensorModels,
  snapshotToSensorModels,
  wsPayloadEventToAnomaly,
} from '@/src/greenhouse/mapApiToUi';
import type { ConnectionStatus, SensorTileModel, SparklineDatum } from '@/src/greenhouse/types';
import { fetchSnapshot } from '@/src/services/snapshot';
import { createWebSocketClient } from '@/src/services/websocketClient';
import {
  getEventsDescending,
  getHistoryAsc,
  getRangesMap,
  openGreenhouseLiveDb,
  seedFromSnapshot,
  upsertEventRow,
  upsertHistoryRow,
} from '@/src/storage/greenhouseLiveSqlite';
import type { UseGreenhouseLiveResult } from '@/src/types/liveDashboard';
import { AGE_TICK_MS } from '@/src/utils/constants';
import { createInitialLiveDebugMetrics } from '@/src/utils/debugMetrics';
import { historyRowsToTempSeries } from '@/src/utils/historySeries';
import { isWsMessage } from '@/src/utils/wsGuards';

export function useGreenhouseLive(): UseGreenhouseLiveResult {
  const [bootKey, setBootKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sensors, setSensors] = useState<SensorTileModel[]>([]);
  const [sparklineSeries, setSparklineSeries] = useState<SparklineDatum[]>([]);
  const [eventItems, setEventItems] = useState<EventListItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('reconnecting');
  const [summary, setSummary] = useState('');
  const [siteName, setSiteName] = useState('Greenhouse');
  const [snapshotIso, setSnapshotIso] = useState<string>(new Date().toISOString());
  const [debugMetrics, setDebugMetrics] = useState(createInitialLiveDebugMetrics);

  const dbRef = useRef<SQLiteDatabase | null>(null);
  const rangesRef = useRef<ApiRanges | null>(null);
  const lastMsgAtRef = useRef(Date.now());
  const bootKeyRef = useRef(bootKey);
  bootKeyRef.current = bootKey;

  /** Keep debug “last event age” ticking while idle. */
  useEffect(() => {
    const id = setInterval(() => {
      setDebugMetrics((m) => ({
        ...m,
        lastEventAgeMs: Math.max(0, Date.now() - lastMsgAtRef.current),
      }));
    }, AGE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const lastSnapshotLabel = useMemo(() => formatLastUpdateLabel(snapshotIso), [snapshotIso]);

  /** Snapshot HTTP → SQLite seed → readings + chart + UI + debug baseline. */
  useEffect(() => {
    const session = bootKey;
    let cancelled = false;
    const isActive = () => !cancelled && bootKeyRef.current === session;

    const transport = { lastSeq: null as number | null, ema: 0 };

    async function refreshSparklineFromDb() {
      const db = dbRef.current;
      if (!db || !isActive()) return;
      const rows = await getHistoryAsc(db);
      if (!isActive()) return;
      setSparklineSeries(historyRowsToTempSeries(rows));
    }

    async function applySnapshot(db: SQLiteDatabase, snap: ApiSnapshot) {
      await seedFromSnapshot(db, snap);
      if (!isActive()) return;

      transport.lastSeq = snap.seq;
      transport.ema = 0;
      lastMsgAtRef.current = Date.now();

      rangesRef.current = snap.ranges;
      setSensors(snapshotToSensorModels(snap));
      setSiteName(prettifyGreenhouseId(snap.greenhouseId));
      setSummary(snap.summary);
      setConnectionStatus(apiStatusToConnection(snap.status));
      setSnapshotIso(snap.timestamp);

      const rows = await getHistoryAsc(db);
      if (!isActive()) return;
      setSparklineSeries(historyRowsToTempSeries(rows));

      const events = await getEventsDescending(db);
      if (!isActive()) return;
      setEventItems(anomaliesToItems(events));

      setDebugMetrics({
        ...createInitialLiveDebugMetrics(),
        sequence: snap.seq,
        version: snap.version,
        lastEventAgeMs: 0,
        eventsPerSecEma: 0,
      });
    }

    /** When HTTP snapshot fails but a prior session populated SQLite — show tiles + chart from disk. */
    async function hydrateFromSqlite(db: SQLiteDatabase): Promise<boolean> {
      const ranges = await getRangesMap(db);
      const rowsAsc = await getHistoryAsc(db);
      if (!ranges || rowsAsc.length === 0) return false;

      const latest = rowsAsc[rowsAsc.length - 1];
      const reading = { temperature: latest.temp, humidity: latest.humid, co2: latest.co2 };

      transport.lastSeq = latest.seq;
      transport.ema = 0;
      lastMsgAtRef.current = Date.now();

      rangesRef.current = ranges;
      setSensors(readingToSensorModels(reading, ranges));
      setSparklineSeries(historyRowsToTempSeries(rowsAsc));
      setSnapshotIso(latest.ts);

      const events = await getEventsDescending(db);
      if (!isActive()) return false;
      setEventItems(anomaliesToItems(events));

      setSummary('Offline — showing last readings saved on this device.');
      setConnectionStatus('offline');

      setDebugMetrics({
        ...createInitialLiveDebugMetrics(),
        sequence: latest.seq,
        version: 0,
        lastEventAgeMs: 0,
        eventsPerSecEma: 0,
      });

      return true;
    }

    async function handleWsMessage(msg: ApiWsMessage) {
      if (!isActive() || bootKeyRef.current !== session) return;

      const now = Date.now();
      const prevAt = lastMsgAtRef.current;
      lastMsgAtRef.current = now;
      const interval = Math.max(1, now - prevAt);
      transport.ema = EMA_ALPHA * (1000 / interval) + (1 - EMA_ALPHA) * transport.ema;

      const seq = msg.seq;
      let dupInc = 0;
      let gapInc = 0;
      if (transport.lastSeq !== null) {
        if (seq <= transport.lastSeq) dupInc = 1;
        else if (seq > transport.lastSeq + 1) gapInc = 1;
      }
      transport.lastSeq = seq;

      setDebugMetrics((m) => ({
        ...m,
        sequence: seq,
        version: msg.version,
        eventsPerSecEma: transport.ema,
        duplicateCount: m.duplicateCount + dupInc,
        gapCount: m.gapCount + gapInc,
      }));

      if (typeof msg.summary === 'string' && msg.summary.length > 0) {
        setSummary(msg.summary);
      }
      const st = typeof msg.status === 'string' && msg.status.length > 0 ? msg.status : 'LIVE';
      setConnectionStatus(apiStatusToConnection(st));

      const db = dbRef.current;
      if (db && msg.reading) {
        await upsertHistoryRow(db, seq, msg.timestamp, msg.reading);
        await refreshSparklineFromDb();
      }

      const ranges = rangesRef.current;
      if (ranges && msg.reading) {
        setSensors((prev) => {
          const next = applyReadingToSensors(prev, msg.reading!, ranges);
          const t = next.find((s) => s.id === 'temp');
          const h = next.find((s) => s.id === 'humidity');
          const c = next.find((s) => s.id === 'co2');
          if (t && h && c) {
            rangesRef.current = {
              temperature: t.thresholds,
              humidity: h.thresholds,
              co2: c.thresholds,
            };
          }
          return next;
        });
      }

      if (msg.event) {
        const row = wsPayloadEventToAnomaly(msg.event);
        const dbEvt = dbRef.current;
        if (dbEvt) {
          await upsertEventRow(dbEvt, row);
          if (!isActive()) return;
          const list = await getEventsDescending(dbEvt);
          if (!isActive()) return;
          setEventItems(anomaliesToItems(list));
        }
      }

      setSnapshotIso(msg.timestamp);
    }

    const socket = createWebSocketClient(WS_URL, {
      isActive,
      onConnected: (isReconnect) => {
        setConnectionStatus('live');
        if (isReconnect) {
          setDebugMetrics((m) => ({ ...m, reconnectCount: m.reconnectCount + 1 }));
        }
      },
      onReconnecting: () => setConnectionStatus('reconnecting'),
      onJsonMessage: (data) => {
        if (!isWsMessage(data)) return;
        void handleWsMessage(data);
      },
    });

    void (async () => {
      setLoading(true);
      setError(null);
      socket.disconnect();

      try {
        const db = await openGreenhouseLiveDb();
        if (!isActive()) return;
        dbRef.current = db;

        try {
          const snap = await fetchSnapshot();
          if (!isActive()) return;

          await applySnapshot(db, snap);
          if (!isActive()) return;

          socket.connect();
        } catch (fetchErr) {
          if (!isActive()) return;
          const hydrated = await hydrateFromSqlite(db);
          if (!isActive()) return;
          if (hydrated) {
            setError(null);
            /* Leave WebSocket disconnected until Retry/snapshot succeeds — avoids reconnect noise while server is down. */
          } else {
            setError(fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr)));
            setConnectionStatus('offline');
          }
        }
      } catch (e) {
        if (!isActive()) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setConnectionStatus('offline');
      } finally {
        if (isActive()) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [bootKey]);

  const retry = useCallback(() => {
    setBootKey((k) => k + 1);
  }, []);

  return {
    siteName,
    connectionStatus,
    summary,
    lastSnapshotLabel,
    sensors,
    sparkline: {
      series: sparklineSeries,
      empty: sparklineSeries.length < 2,
    },
    eventItems,
    debugMetrics,
    loading,
    error,
    retry,
  };
}
