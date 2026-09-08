import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL ?? API_BASE_URL.replace(/^http/, 'ws');
const MAX_RECONNECT_DELAY = 10_000;
const ALLOW_ANONYMOUS = import.meta.env.VITE_WS_ALLOW_ANONYMOUS === "true";

export type WebSocketStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export interface WebSocketMessage {
  data: string;
  receivedAt: number;
}

interface WebSocketContextValue {
  status: WebSocketStatus;
  messages: WebSocketMessage[];
  sendMessage: (message: string | Record<string, unknown>) => boolean;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const manuallyClosedRef = useRef(false);
  const [status, setStatus] = useState<WebSocketStatus>('idle');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if ((!token && !ALLOW_ANONYMOUS) || manuallyClosedRef.current || socketRef.current?.readyState === WebSocket.OPEN) {
        return;
    }


    clearReconnectTimer();
    setStatus('connecting');
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptRef.current = 0;
      setStatus('open');
    };

    socket.onmessage = async (event) => {
      const data = typeof event.data === 'string'
        ? event.data
        : event.data instanceof Blob
          ? await event.data.text()
          : new TextDecoder().decode(event.data);

      setMessages((currentMessages) => [
        ...currentMessages.slice(-99),
        { data, receivedAt: Date.now() },
      ]);
    };

    socket.onerror = () => {
      setStatus('error');
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) {
        return;
      }
      socketRef.current = null;

      if (manuallyClosedRef.current) {
        setStatus('idle');
        return;
      }

      setStatus('closed');
      const delay = Math.min(1_000 * 2 ** reconnectAttemptRef.current, MAX_RECONNECT_DELAY);
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
    };
  }, [clearReconnectTimer, token]);

  connectRef.current = connect;

  const close = useCallback(() => {
    manuallyClosedRef.current = true;
    clearReconnectTimer();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close(1000, 'Session closed');
    }
    setStatus('idle');
  }, [clearReconnectTimer]);

  useEffect(() => {
    manuallyClosedRef.current = false;
    reconnectAttemptRef.current = 0;

    if (token || ALLOW_ANONYMOUS) {
        connect();
    } else {
        close();
        setMessages([]);
    }

    return close;
  }, [close, connect, token]);

  const sendMessage = useCallback((message: string | Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    return true;
  }, []);

  const reconnect = useCallback(() => {
    close();
    manuallyClosedRef.current = false;
    reconnectAttemptRef.current = 0;
    connect();
  }, [close, connect]);

  return (
    <WebSocketContext.Provider value={{ status, messages, sendMessage, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}