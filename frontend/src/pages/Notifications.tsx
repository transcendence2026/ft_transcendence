import AppLayout, { SidebarAccount } from "../components/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useState } from "react";

export default function Notifications() {
  const { logout } = useAuth();
  const { notification, markAllAsRead, markAsRead } = useNotification();
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateFriendRequest = async (requestId: string, action: "accept" | "reject") => {
    setProcessingRequestId(requestId);
    setActionError(null);
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/${action}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Friend request update failed: ${response.status}`);
      }
      const item = notification.find((candidate) => candidate.data.requestId === requestId);
      if (item) markAsRead(item.id);
    } catch (error) {
      console.error("No se pudo actualizar la solicitud de amistad", error);
      setActionError("No se pudo actualizar la solicitud de amistad.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  return (
    <AppLayout sidebarFooter={<SidebarAccount onLogout={() => void logout()} />}>
      <main className="flex-1 bg-[#0f0e0d] p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-5">
            <div>
              <p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
                CENTRO DE AVISOS
              </p>
              <h1 className="mt-1 text-[30px] tracking-[-0.5px] text-[#e6e1df]">Notificaciones</h1>
              <p className="mt-2 text-sm text-[#a88a83]">
                Mantente al día con la actividad de tu espacio Épicure.
              </p>
            </div>
            {notification.some((item) => !item.read) && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="border border-white/10 bg-[#211f1e] px-3 py-2 text-[11px] tracking-[1px] text-[#a88a83] uppercase transition-colors hover:border-[#fabc4d]/40 hover:text-[#fabc4d]"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <section className="border border-white/5 bg-[#1d1b1a]">
            {actionError && (
              <p role="alert" className="border-b border-red-400/20 bg-red-950/20 px-5 py-3 text-sm text-red-200">
                {actionError}
              </p>
            )}
            {notification.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-[11px] font-bold tracking-[2px] text-[#fabc4d] uppercase">
                  TODO EN ORDEN
                </p>
                <h2 className="mt-2 text-xl text-[#e6e1df]">No tienes notificaciones</h2>
                <p className="mt-2 text-sm text-[#a88a83]">
                  Aquí aparecerán los avisos importantes de tu actividad.
                </p>
              </div>
            ) : (
              <div>
                {notification
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`flex w-full items-start gap-4 border-b border-white/5 p-5 text-left transition-colors last:border-0 hover:bg-[#211f1e] ${
                        item.read ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full ${
                          item.read ? "bg-[#a88a83]/40" : "bg-[#ffb4a1]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block text-sm leading-6 text-[#e6e1df]">
                          {item.data.message}
                        </span>
                        <span className="mt-1 block text-[10px] tracking-[1px] text-[#a88a83] uppercase">
                          {item.data.type}
                        </span>
                        </button>
                      <span className="flex shrink-0 items-center gap-3">
                        {item.data.type === "friend_request" && item.data.requestId && (
                          <>
                            <span className="flex gap-2">
                              <button
                                type="button"
                                disabled={processingRequestId === item.data.requestId}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void updateFriendRequest(item.data.requestId!, "accept");
                                }}
                                className="border border-[#fabc4d]/40 px-2 py-1 text-[10px] tracking-[1px] text-[#fabc4d] uppercase disabled:opacity-50"
                              >
                                Aceptar
                              </button>
                              <button
                                type="button"
                                disabled={processingRequestId === item.data.requestId}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void updateFriendRequest(item.data.requestId!, "reject");
                                }}
                                className="border border-white/10 px-2 py-1 text-[10px] tracking-[1px] text-[#a88a83] uppercase disabled:opacity-50"
                              >
                                Rechazar
                              </button>
                            </span>
                          </>
                        )}
                        {!item.read && (
                          <span className="text-[10px] tracking-[1px] text-[#fabc4d] uppercase">
                            Nueva
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AppLayout>
  );
}
