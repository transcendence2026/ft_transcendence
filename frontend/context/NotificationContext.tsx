import {
  createContext,
  useContext,
  useEffect,
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

interface NotificationContextValue {
  notification: NotificationType[]
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  error: string | undefined;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { status, messages } = useWebSocket();
  
  const [notification, setNotification] = useState<NotificationType[]>([])
  const [error, setError ] = useState<string | undefined>(undefined)


  useEffect(() => {
    if (status === 'open') {
      void fetch('/api/notifications', { credentials: 'include' })
        .then((response) => {
          if (!response.ok) throw new Error('Unable to load notifications');
          return response.json() as Promise<NotificationType[]>;
        })
        .then(setNotification)
        .catch(() => setError('Unable to load notifications'));
    }
  }, [status]);

  useEffect(() => {
    if (status != 'open' || messages.length <= 0) return;

    try {
      const lastMessage = JSON.parse(messages.slice(-1)[0].data) as {
        event?: string;
        data?: NotificationType;
      };

      if (lastMessage.event === 'notification' && lastMessage.data) {
        setNotification((prev) => [
          lastMessage.data!,
          ...prev.filter((notification) => notification.id !== lastMessage.data!.id),
        ]);
      }
    } catch (err) {
      setError("Error will catching notifications");
    }
  }, [messages, status])

  const markAsRead = (notificationId: string) => {
    void fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      credentials: 'include',
    }).catch(() => setError('Unable to mark notification as read'));
    setNotification(prevState => {
      return prevState.map((notif) => {
        if (notif.id === notificationId) {
          return { ...notif, read: true };
        }
        return notif;
      });
    })
  }
  const markAllAsRead = () => {
    void fetch('/api/notifications/read-all', {
      method: 'PATCH',
      credentials: 'include',
    }).catch(() => setError('Unable to mark notifications as read'));
    setNotification(prevState => {
      return prevState?.map((notif) => {
        return {...notif, read: true}
      })
    })
  }

  return (
    <NotificationContext.Provider value={{ notification, markAsRead, markAllAsRead, error }}>
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