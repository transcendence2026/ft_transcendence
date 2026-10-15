import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  ChefHat,
  Compass,
  LogOut,
  MessageCircle,
  Search,
  UserRound,
  Utensils,
  Wine,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { id: "flux", label: "INICIO", icon: Compass, href: "/dashboard" },
  { id: "curiosities", label: "EXPLORAR", icon: Search, href: "/discover" },
  { id: "cave", label: "RESERVAS Y BODEGA", icon: Wine, href: "/reservations" },
  { id: "salons", label: "MENSAJES", icon: MessageCircle, href: "/chat" },
  { id: "atelier", label: "COCINA Y MENÚS", icon: Utensils, href: "/notifications" },
];

interface AppLayoutProps {
  children: ReactNode;
  sidebarFooter?: ReactNode;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  onNotify?: () => void;
}

export default function AppLayout({
  children,
  sidebarFooter,
  isSaved = false,
  onToggleSaved,
  onNotify,
}: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const username = user?.username ?? "Usuario";

  return (
    <div className="relative flex min-h-screen w-full bg-[#141312] pl-[288px] font-['Liberation_Serif',serif] text-[#e6e1df]">
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
                onClick={onNotify ?? (() => navigate("/notifications"))}
                aria-label="Notificaciones"
                className="relative flex size-9 items-center justify-center hover:bg-white/5"
              >
                <Bell aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#ffb4a1]" />
              </button>
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
