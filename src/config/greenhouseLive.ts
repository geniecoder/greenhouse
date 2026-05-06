/** Cleartext dev LAN — greenhouse snapshot HTTP + WS. */

export const GREENHOUSE_LIVE_HOST = '192.168.1.212';
export const GREENHOUSE_LIVE_PORT = 5050;

export const SNAPSHOT_HTTP_BASE = `http://${GREENHOUSE_LIVE_HOST}:${GREENHOUSE_LIVE_PORT}`;
export const SNAPSHOT_URL = `${SNAPSHOT_HTTP_BASE}/api/snapshot`;
export const UPLOAD_IMAGE_URL = `${SNAPSHOT_HTTP_BASE}/api/upload-image`;
export const WS_URL = `ws://${GREENHOUSE_LIVE_HOST}:${GREENHOUSE_LIVE_PORT}/ws`;

export const HISTORY_CAP = 20;
export const EVENT_CAP = 20;
export const EMA_ALPHA = 0.2;
