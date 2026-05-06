import type { SQLiteDatabase } from 'expo-sqlite';
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';

import type { ConnectionStatus } from '@/src/greenhouse/types';
import { postPlantImageUpload } from '@/src/services/uploadPlantImage';
import {
  countPendingPhotoUploadJobs,
  enqueuePhotoUploadJob,
  getPendingPhotoUploadJobsAscending,
  openGreenhouseLiveDb,
  removePhotoUploadJob,
} from '@/src/storage/greenhouseLiveSqlite';

const PLANT_PHOTO_SUBDIR = 'plant-photos';

function plantPhotosDir(): string {
  const base = documentDirectory;
  if (base == null) {
    throw new Error('Document directory is not available');
  }
  return `${base}${PLANT_PHOTO_SUBDIR}`;
}

async function ensurePlantPhotosDir(): Promise<void> {
  await makeDirectoryAsync(plantPhotosDir(), { intermediates: true });
}

function makePhotoFileName(): string {
  return `plant-${Date.now()}-${Math.random().toString(16).slice(2, 10)}.jpg`;
}

/**
 * Camera capture → copy into app storage → SQLite queue → upload when network + greenhouse live agree.
 */
export function usePlantPhotoUpload(greenhouseConnection: ConnectionStatus) {
  const [pendingCount, setPendingCount] = useState(0);
  const dbRef = useRef<SQLiteDatabase | null>(null);
  const flushingRef = useRef(false);
  const liveRef = useRef(greenhouseConnection);
  liveRef.current = greenhouseConnection;

  const refreshCount = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    const n = await countPendingPhotoUploadJobs(db);
    setPendingCount(n);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensurePlantPhotosDir();
        const db = await openGreenhouseLiveDb();
        if (cancelled) return;
        dbRef.current = db;
        await refreshCount();
      } catch {
        /* db open failed — FAB will no-op until retry */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCount]);

  const flushQueue = useCallback(async () => {
    const db = dbRef.current;
    if (!db || flushingRef.current) return;

    const net = await Network.getNetworkStateAsync();
    const hasTransport = net.isConnected === true;
    if (!hasTransport && liveRef.current !== 'live') return;

    flushingRef.current = true;
    try {
      const jobs = await getPendingPhotoUploadJobsAscending(db);
      const dir = plantPhotosDir();
      for (const job of jobs) {
        const path = `${dir}/${job.id}`;
        const info = await getInfoAsync(path);
        if (!info.exists) {
          await removePhotoUploadJob(db, job.id);
          continue;
        }
        try {
          const result = await postPlantImageUpload(path);
          if (result.success) {
            await deleteAsync(path, { idempotent: true });
            await removePhotoUploadJob(db, job.id);
          } else {
            break;
          }
        } catch {
          break;
        }
      }
    } finally {
      flushingRef.current = false;
      await refreshCount();
    }
  }, [refreshCount]);

  useEffect(() => {
    if (greenhouseConnection === 'live') void flushQueue();
  }, [greenhouseConnection, flushQueue]);

  useEffect(() => {
    if (pendingCount <= 0) return;
    const id = setInterval(() => void flushQueue(), 12_000);
    return () => clearInterval(id);
  }, [pendingCount, flushQueue]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void flushQueue();
    });
    return () => sub.remove();
  }, [flushQueue]);

  const captureAndQueue = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera', 'Plant photo capture is available on iOS and Android.');
      return;
    }
    const db = dbRef.current;
    if (!db) {
      Alert.alert('Storage', 'Database is not ready yet. Try again in a moment.');
      return;
    }

    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (!cam.granted) {
      Alert.alert('Camera', 'Camera access is needed to photograph plants.');
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.82,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;

    try {
      await ensurePlantPhotosDir();
      const base = makePhotoFileName();
      const dest = `${plantPhotosDir()}/${base}`;
      await copyAsync({ from: picked.assets[0].uri, to: dest });
      await enqueuePhotoUploadJob(db, base, Date.now());
      await refreshCount();
      void flushQueue();
    } catch (e) {
      Alert.alert('Photo', e instanceof Error ? e.message : 'Could not save photo');
    }
  }, [flushQueue, refreshCount]);

  return { pendingCount, captureAndQueue, flushQueue };
}
