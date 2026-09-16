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
  event: string;
  data: {
    type: string;
    message: string;
    senderId: string;
  }
  read: boolean;
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
    if (status != 'open' || messages.length <= 0) return;

    try {
      const lastMessage: NotificationType = JSON.parse(messages.slice(-1)[0].data);  

      if (lastMessage.event == 'notification')
        setNotification(prev => [...prev, { ...lastMessage, read: false, id: crypto.randomUUID() }]);
    } catch (err) {
      setError("Error will catching notifications");
    }
  }, [messages, status])

  const markAsRead = (notificationId: string) => {
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