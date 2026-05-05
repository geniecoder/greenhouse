const MAX_BACKOFF_MS = 30_000;

export type WebSocketClient = {
  connect: () => void;
  disconnect: () => void;
};

/**
 * Minimal reconnecting WebSocket: connect / disconnect, JSON onMessage, exponential backoff.
 */
export function createWebSocketClient(
  url: string,
  opts: {
    isActive: () => boolean;
    onConnected: (isReconnect: boolean) => void;
    onReconnecting: () => void;
    onJsonMessage: (data: unknown) => void;
  },
): WebSocketClient {
  let stopped = true;
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let backoffAttempt = 0;
  let hasConnectedOnce = false;

  const clearTimer = () => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const disconnect = () => {
    stopped = true;
    clearTimer();
    if (socket) {
      try {
        socket.close();
      } catch {
        /* noop */
      }
      socket = null;
    }
  };

  const open = () => {
    clearTimer();
    if (socket) {
      try {
        socket.close();
      } catch {
        /* noop */
      }
      socket = null;
    }
    if (stopped || !opts.isActive()) return;

    socket = new WebSocket(url);

    socket.onopen = () => {
      if (stopped || !opts.isActive()) return;
      backoffAttempt = 0;
      const isReconnect = hasConnectedOnce;
      hasConnectedOnce = true;
      opts.onConnected(isReconnect);
    };

    socket.onmessage = (ev) => {
      if (stopped || !opts.isActive()) return;
      try {
        opts.onJsonMessage(JSON.parse(String(ev.data)));
      } catch {
        /* ignore bad frames */
      }
    };

    socket.onerror = () => {
      if (stopped || !opts.isActive()) return;
      opts.onReconnecting();
    };

    socket.onclose = () => {
      socket = null;
      if (stopped || !opts.isActive()) return;
      opts.onReconnecting();
      const attempt = backoffAttempt++;
      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempt, 5));
      reconnectTimer = setTimeout(open, delay);
    };
  };

  return {
    connect: () => {
      stopped = false;
      hasConnectedOnce = false;
      backoffAttempt = 0;
      open();
    },
    disconnect,
  };
}
