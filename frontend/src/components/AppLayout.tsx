import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Bookmark,
  ChefHat,
  Compass,
  LogOut,
  MessageCircle,
  Search,
  UserRound,
  Wine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

const NAV_ITEMS = [
  { id: "flux", label: "INICIO", icon: Compass, href: "/dashboard" },
  { id: "curiosities", label: "EXPLORAR", icon: Search, href: "/discover" },
  { id: "cave", label: "RESERVAS Y BODEGA", icon: Wine, href: "/reservations" },
  { id: "salons", label: "MENSAJES", icon: MessageCircle, href: "/chat" },
  { id: "atelier", label: "NOTIFICACIONES", icon: Bell, href: "/notifications" },
];

interface AppLayoutProps {
  children: ReactNode;
  sidebarFooter?: ReactNode;
  isSaved?: boolean;
  onToggleSaved?: () => void;
}

export default function AppLayout({
  children,
  sidebarFooter,
  isSaved = false,
  onToggleSaved,
}: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const username = user?.username ?? "Usuario";
  const { notification, markAllAsRead, markAsRead } = useNotification();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<typeof notification[number]>();
  const unreadNotifications = notification.filter((item) => !item.read);

  useEffect(() => {
    const latestNotification = notification.at(-1);
    if (!latestNotification || sessionStorage.getItem(`notification-toast:${latestNotification.id}`)) {
      return;
    }

    sessionStorage.setItem(`notification-toast:${latestNotification.id}`, "shown");
    setToastNotification(latestNotification);
    const timeoutId = window.setTimeout(() => setToastNotification(undefined), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  useEffect(() => {
    if (!isNotificationOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsNotificationOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isNotificationOpen]);

  return (
    <div className="relative flex min-h-screen w-full bg-[#141312] pl-[288px] font-['Liberation_Serif',serif] text-[#e6e1df]">
      {toastNotification && (
        <div
          role="status"
          className="fixed top-5 right-6 z-50 w-[min(360px,calc(100vw-3rem))] border border-[#fabc4d]/30 bg-[#211f1e] p-4 shadow-2xl shadow-black/40"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-[#fabc4d]/30 bg-[#2b2a28] text-[#fabc4d]">
              <Bell aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </div>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                markAsRead(toastNotification.id);
                setToastNotification(undefined);
                navigate("/notifications");
              }}
            >
              <p className="text-[10px] font-bold tracking-[1.8px] text-[#fabc4d] uppercase">
                Nueva notificación
              </p>
              <p className="mt-1 text-sm leading-5 text-[#e6e1df]">{toastNotification.data.message}</p>
              <p className="mt-2 text-[10px] tracking-[1px] text-[#a88a83] uppercase">
                Ver centro de avisos
              </p>
            </button>
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => setToastNotification(undefined)}
              className="text-[#a88a83] transition-colors hover:text-[#e6e1df]"
            >
              <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </button>
          </div>
          <div className="mt-3 h-px overflow-hidden bg-white/5">
            <div className="h-full w-full origin-left animate-[toast-progress_6s_linear_forwards] bg-[#fabc4d]/60" />
          </div>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[288px] flex-col justify-between border-r border-white/5 bg-[#0f0e0d]">
        <div>
          <div className="flex h-[80px] items-center justify-between border-b border-white/5 px-6">
            <div>
              <p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
                PANEL PRINCIPAL
              </p>
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-[#e6e1df]">Mi Espacio</h2>
            </div>
            <ChefHat aria-hidden="true" className="h-4 w-4 text-[#fabc4d]" strokeWidth={1.5} />
          </div>

          <div className="px-4 pt-6">
            <p className="px-3 pb-2 text-[11px] font-bold tracking-[2.2px] text-[#a88a83] uppercase">
              MENÚ
            </p>
            <nav aria-label="Main navigation" className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={`flex w-full items-center gap-3 py-2 text-left text-[12px] tracking-[0.6px] uppercase transition-colors ${
                      isActive
                        ? "border-l-2 border-[#ffb4a1] bg-[#2b2a28] pl-[18px] pr-3 text-[#ffb4a1]"
                        : "px-3 text-[#e0bfb7] hover:bg-white/5"
                    }`}
                  >
                    <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {sidebarFooter}
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-[80px] items-center justify-between border-b border-white/5 bg-[#141312]/85 px-6 backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <ChefHat aria-hidden="true" className="h-8 w-8 text-[#fabc4d]" strokeWidth={1.25} />
              <div>
                <p className="text-[20px] font-bold tracking-[-0.5px] text-[#e6e1df]">Épicure</p>
                <p className="text-[11px] font-bold tracking-[2.2px] text-[#a88a83] uppercase">
                  RESTAURANTE Y RESERVAS
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border border-amber-500/10 bg-[#1d1b1a] px-3 py-1">
              <span className="size-1.5 rounded-full bg-[#fabc4d]" />
              <span className="text-[11px] font-bold tracking-[1.98px] text-[#fabc4d] uppercase">
                EN LÍNEA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-r border-white/5 pr-4">
              <button
                type="button"
                aria-label="Guardados"
                aria-pressed={isSaved}
                onClick={onToggleSaved ?? (() => navigate("/dashboard"))}
                className="flex size-9 items-center justify-center hover:bg-white/5"
              >
                <Bookmark
                  aria-hidden="true"
                  className={`h-4 w-4 ${isSaved ? "fill-[#fabc4d] text-[#fabc4d]" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
              <button
                type="button"
                onClick={() => setIsNotificationOpen((current) => !current)}
                aria-label="Notificaciones"
                aria-expanded={isNotificationOpen}
                className="relative flex size-9 items-center justify-center hover:bg-white/5"
              >
                <Bell aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex min-h-1.5 min-w-1.5 items-center justify-center rounded-full bg-[#ffb4a1] px-1 text-[8px] text-[#611300]">
                    {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                  </span>
                )}
              </button>
              {isNotificationOpen && (
                <div
                  role="dialog"
                  aria-label="Aperçu des notifications"
                  className="absolute top-[68px] right-[116px] z-30 w-[320px] border border-white/10 bg-[#211f1e] p-4 text-left shadow-2xl shadow-black/40"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                    <div>
                      <p className="text-[11px] font-bold tracking-[2px] text-[#fabc4d] uppercase">
                        CENTRO DE AVISOS
                      </p>
                      <h2 className="mt-1 text-[20px] text-[#e6e1df]">Notificaciones</h2>
                    </div>
                    {unreadNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllAsRead()}
                        className="text-[10px] tracking-[0.5px] text-[#a88a83] uppercase hover:text-[#fabc4d]"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto py-2">
                    {notification.length === 0 ? (
                      <p className="py-5 text-center text-[12px] text-[#a88a83]">
                        No tienes notificaciones nuevas.
                      </p>
                    ) : (
                      notification.slice(-5).reverse().map((item) => (
                        <div
                          key={item.id}
                          className={`border-b border-white/5 px-1 py-3 last:border-0 ${item.read ? "opacity-60" : ""}`}
                        >
                          <p className="text-[12px] leading-5 text-[#e6e1df]">{item.data.message}</p>
                          <p className="mt-1 text-[10px] tracking-[0.6px] text-[#a88a83] uppercase">
                            {item.data.type}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate("/notifications");
                    }}
                    className="mt-2 w-full border border-[#fabc4d]/30 bg-[#2b2a28] px-3 py-2 text-[11px] font-bold tracking-[1px] text-[#fabc4d] uppercase transition-colors hover:bg-[#fabc4d]/10"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-3 pl-2 text-left transition-opacity hover:opacity-80"
            >
              <div className="text-right">
                <p className="text-[12px] text-[#e6e1df]">{username}</p>
                <p className="text-[11px] font-bold tracking-[0.55px] text-[#a88a83] uppercase">
                  MI PERFIL
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-full bg-[#ffb4a1]">
                <UserRound aria-hidden="true" className="size-3 text-[#611300]" strokeWidth={2} />
              </div>
            </button>
          </div>
        </header>

        <div className="h-[4px] w-full bg-gradient-to-r from-transparent via-[#fabc4d]/40 to-transparent" />
        {children}
      </div>
    </div>
  );
}

export function SidebarAccount({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const username = user?.username ?? "Usuario";

  return (
    <div className="border-t border-white/5 bg-[#1d1b1a]/60 p-4">
      <div className="flex items-center justify-between border border-white/5 bg-[#211f1e] p-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#e6e1df]">{username}</p>
          <p className="truncate text-[11px] text-[#a88a83]">{user?.email ?? `@${username}`}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="flex size-8 shrink-0 items-center justify-center border border-white/5 bg-[#141312] text-[#ffb4a1] transition-colors hover:border-[#ef6540]/40 hover:bg-[#ef6540]/10"
        >
          <LogOut aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
