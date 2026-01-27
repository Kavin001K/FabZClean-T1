/**
 * SocketContext.jsx
 * WebSocket context provider that automatically handles production (wss://) vs development (ws://)
 * This context provides WebSocket connection management for the application
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { getWebSocketUrl } from '@/lib/data-service';

const SocketContext = createContext({
  isConnected: false,
  connectionStatus: 'disconnected',
  sendMessage: () => { },
  subscribe: () => { },
  unsubscribe: () => { },
  reconnect: () => { },
  disconnect: () => { },
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);

  // Get WebSocket URL that automatically handles production (wss://) vs development (ws://)
  // On Vercel/production with HTTPS, this will automatically use wss://
  // In development, this uses ws://localhost
  const wsUrl = useMemo(() => {
    try {
      const url = getWebSocketUrl();
return url;
    } catch (error) {
      console.error('Error getting WebSocket URL:', error);
      // Fallback to current host if getWebSocketUrl fails
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }
  }, []);

  // WebSocket connection hook
  const {
    isConnected,
    connectionStatus,
    sendMessage: wsSendMessage,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useWebSocket({
    url: wsUrl,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    onOpen: () => {
// Resubscribe to any previous subscriptions
      if (subscriptions.length > 0) {
        wsSubscribe(subscriptions);
      }
    },
    onClose: () => {
},
    onError: (error) => {
      // Silently handle errors - WebSocket is optional functionality
      // Only log in development
      if (import.meta.env.DEV) {
        console.error('WebSocket error:', error);
      }
    },
    onMessage: (message) => {
      // Handle messages if needed
      if (import.meta.env.DEV) {
        console.debug('WebSocket message received:', message);
      }
    },
  });

  // Memoized subscribe function
  const subscribe = useCallback((topics) => {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }
    setSubscriptions((prev) => {
      const newSubs = [...new Set([...prev, ...topics])];
      wsSubscribe(newSubs);
      return newSubs;
    });
  }, [wsSubscribe]);

  // Memoized unsubscribe function
  const unsubscribe = useCallback(() => {
    setSubscriptions([]);
    wsUnsubscribe();
  }, [wsUnsubscribe]);

  // Memoized sendMessage function
  const sendMessage = useCallback((message) => {
    if (isConnected) {
      wsSendMessage(message);
    } else {
      console.warn('Cannot send message - WebSocket is not connected');
    }
  }, [isConnected, wsSendMessage]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!isConnected) {
      wsConnect();
    }
  }, [isConnected, wsConnect]);

  // Disconnect function
  const disconnect = useCallback(() => {
    wsDisconnect();
    setSubscriptions([]);
  }, [wsDisconnect]);

  // Auto-connect on mount - the useWebSocket hook handles this automatically
  // But we ensure it's connected when URL changes
  useEffect(() => {
    // The useWebSocket hook automatically connects when initialized
    // This effect ensures reconnection if URL changes
    if (wsConnect && !isConnected && connectionStatus !== 'connecting') {
      // Only auto-connect if not already connected or connecting
      wsConnect();
    }

    return () => {
      // Cleanup on unmount - disconnect is handled by useWebSocket hook
    };
  }, [wsUrl, isConnected, connectionStatus, wsConnect]); // Reconnect if URL changes

  const value = useMemo(() => ({
    isConnected,
    connectionStatus,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnect,
    disconnect,
  }), [isConnected, connectionStatus, sendMessage, subscribe, unsubscribe, reconnect, disconnect]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;

