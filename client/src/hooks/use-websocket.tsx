import { useEffect, useRef, useState, useCallback } from 'react';
import { isElectron } from '@/lib/utils';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  message?: string;
  clientId?: string;
}

interface UseWebSocketOptions {
  url: string | null;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

// Electron-optimized defaults
const ELECTRON_RECONNECT_INTERVAL = 2000;  // Faster in desktop app
const BROWSER_RECONNECT_INTERVAL = 3000;
const ELECTRON_MAX_RECONNECTS = 10;        // More attempts in Electron (local network)
const BROWSER_MAX_RECONNECTS = 5;
const HEARTBEAT_INTERVAL = 30000;          // Ping every 30 seconds to keep connection alive

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = isElectron() ? ELECTRON_RECONNECT_INTERVAL : BROWSER_RECONNECT_INTERVAL,
  maxReconnectAttempts = isElectron() ? ELECTRON_MAX_RECONNECTS : BROWSER_MAX_RECONNECTS,
  enabled = true
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<string[]>([]);

  // Use refs to store callbacks to prevent re-renders
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (!url) {
      // No URL provided (e.g. Vercel environment), skip connection
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onOpenRef.current?.();

        // Resubscribe to previous subscriptions
        if (subscriptionsRef.current.length > 0) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            topics: subscriptionsRef.current
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onCloseRef.current?.();

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setConnectionStatus('error');
          console.error('Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        // Silently handle connection errors - WebSocket is optional functionality
        // Only log if there's an actual error object with details
        if (error && typeof error === 'object' && 'message' in error) {
          console.error('WebSocket error:', error);
        }
        setConnectionStatus('error');
        onErrorRef.current?.(error);
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [url, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, []);

  const subscribe = useCallback((topics: string[]) => {
    subscriptionsRef.current = topics;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        topics
      }));
    }
  }, []);

  const unsubscribe = useCallback(() => {
    subscriptionsRef.current = [];
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe'
      }));
    }
  }, []);

  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]); // Only reconnect when URL or enabled changes

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    ping
  };
}
