# Greenhouse Guard

A React Native app that monitors greenhouse sensors in real time — temperature, humidity, CO₂ — with a live sparkline, anomaly event feed, offline SQLite cache, and a camera FAB that queues plant photos for upload.

---

## Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/geniecoder/greenhouse.git
   cd greenhouse
   npm install
   ```

2. **Point it at your backend**

   Open `src/config/greenhouseLive.ts` and set the two constants at the top:

   ```ts
   export const GREENHOUSE_LIVE_HOST = '192.168.1.140'; // your server IP
   export const GREENHOUSE_LIVE_PORT = 5050;
   ```

   Everything else (snapshot URL, WebSocket URL, image upload URL) derives from those.

3. **Native build** — required once, and any time you change `app.json` plugins or add native packages:

   ```bash
   npx expo run:android --device
   # or
   npx expo run:ios
   ```

---

## Run

```bash
npm start          # Expo Dev Tools (Metro) — press a for Android, i for iOS
npm run android    # full native Android build + launch
npm run ios        # full native iOS build + launch
npm run web        # web preview (camera / SQLite features are Android/iOS only)
```

---

## Lint & type-check

No automated test suite yet. Run these before committing:

```bash
npx tsc --noEmit   # catches type errors across the whole project
npm run lint       # Expo-flavoured ESLint
```

---

## How the transport works

| Stage | What happens |
|---|---|
| **App open** | `GET /api/snapshot` — one request bootstraps all sensor readings, thresholds, chart history, and the latest anomalies into SQLite. |
| **Live** | WebSocket (`/ws`) streams `reading_delta` and `anomaly_event` frames. Each one updates tiles, chart, and SQLite in real time. |
| **Reconnect** | WS uses exponential backoff. On successful reconnect the app re-fetches the snapshot so chart history stays aligned with the server rather than frozen. |
| **Offline** | If the snapshot fetch fails on launch, the app hydrates from the last SQLite session so you still see recent readings and events without any error screen. |
| **Photos** | Camera shot → saved to `documentDirectory/plant-photos/` → queued in SQLite → `POST /api/upload-image` (multipart, field `image`) when online. Retried every 12 s and on app resume until it succeeds. |

---

## Trade-offs & known limits

- **Plain HTTP / LAN IP.** The dev defaults use cleartext HTTP on a local IP — simple for a bench setup, not suitable for production. Swap in HTTPS/WSS and move the host to an env variable when you ship.

- **Capped SQLite.** Chart history keeps the last 20 readings (`HISTORY_CAP`) and the event feed keeps the last 20 anomalies (`EVENT_CAP`). Older rows are pruned automatically so the database stays small. Raise the caps in `src/config/greenhouseLive.ts` if you need more.

- **Best-effort photo uploads.** Failed uploads stay queued locally and retry on the next connected session. If a file is somehow missing from disk the queue entry is silently cleaned up. The multipart field name (`image`) must match whatever your backend expects.

- **Web is limited.** `npm run web` works for layout testing but camera capture, file system access, and SQLite are all Android/iOS only.
