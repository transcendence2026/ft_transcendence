import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useWebSocket } from "./WebSocketContext";

type NotificationType = {
  id: string;
  type: string;
  message: string;
  senderId: string;
  receiverId: string;
  requestId?: string | null;
  read: boolean;
  createdAt: string;
  event?: string;
}

export function getNotificationDestination(
  notification: Pick<NotificationType, 'type' | 'senderId'>,
): string | null {
  if (notification.type === 'message') {
    return `/chat?userId=${encodeURIComponent(notification.senderId)}`;
  }
  return null;
}

interface NotificationContextValue {
  notification: NotificationType[]
  incomingNotification: NotificationType | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismissNotification: (notificationId: string) => Promise<void>
  error: string | undefined;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status, messages } = useWebSocket();
  
  const [notification, setNotification] = useState<NotificationType[]>([])
  const [incomingNotification, setIncomingNotification] = useState<NotificationType | null>(null)
  const [error, setError ] = useState<string | undefined>(undefined)
  const processedMessages = useRef(new WeakSet<object>())
  const notificationRef = useRef(notification)

  useEffect(() => {
    notificationRef.current = notification;
  }, [notification]);

  useEffect(() => {
    if (status !== 'open') {
      if (status === 'idle') {
        setNotification([]);
        setIncomingNotification(null);
        setError(undefined);
      }
      return;
    }

    let isCurrentSession = true;
    const knownNotificationIds = new Set(notificationRef.current.map((item) => item.id));
    void fetch('/api/notifications', { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load notifications');
        return response.json() as Promise<NotificationType[]>;
      })
      .then((loadedNotifications) => {
        if (!isCurrentSession) return;
        setNotification((current) => {
          const notificationsById = new Map(
            loadedNotifications.map((item) => [item.id, item]),
          );
          current.forEach((item) => {
            if (notificationsById.has(item.id) || !knownNotificationIds.has(item.id)) {
              notificationsById.set(item.id, item);
            }
          });
          return [...notificationsById.values()].sort(
            (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
          );
        });
        setError(undefined);
      })
      .catch(() => {
        if (isCurrentSession) setError('Unable to load notifications');
      });

    return () => {
      isCurrentSession = false;
    };
  }, [status]);

  useEffect(() => {
    if (status != 'open' || messages.length <= 0) return;

    for (const frame of messages) {
      if (processedMessages.current.has(frame)) continue;
      processedMessages.current.add(frame);
      if (frame.data === 'Bienvenido al WebSocket !') continue;

      try {
        const lastMessage = JSON.parse(frame.data) as {
          event?: string;
          data?: NotificationType;
        };

        if (lastMessage.event === 'notification' && lastMessage.data) {
          setIncomingNotification(lastMessage.data);
          setNotification((prev) => [
            lastMessage.data!,
            ...prev.filter((notification) => notification.id !== lastMessage.data!.id),
          ]);
        }
      } catch {
        setError('Unable to process notification message');
      }
    }
  }, [messages, status])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Unable to mark notification as read');
      setNotification((prevState) => prevState.map((notif) => (
        notif.id === notificationId ? { ...notif, read: true } : notif
      )));
      setError(undefined);
    } catch {
      setError('Unable to mark notification as read');
    }
  }
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Unable to mark notifications as read');
      setNotification((prevState) => prevState.map((notif) => ({ ...notif, read: true })));
      setError(undefined);
    } catch {
      setError('Unable to mark notifications as read');
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Unable to dismiss notification');
      setNotification((current) => current.filter((notif) => notif.id !== notificationId));
      setError(undefined);
    } catch {
      setError('Unable to dismiss notification');
    }
  }

  return (
    <NotificationContext.Provider value={{
      notification,
      incomingNotification,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      error,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}