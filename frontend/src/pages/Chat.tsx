import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  BadgeCheck,
  Image,
  Info,
  MessageCircle,
  Mic,
  Paperclip,
  Pin,
  Play,
  Plus,
  Search,
  Send,
  Wine,
} from "lucide-react";
import AppLayout from "../components/AppLayout";

import { useWebSocket } from "../../context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";

export interface SalonThread {
  id: string;
  category: string;
  isLive?: boolean;
  isGoldCategory?: boolean;
  timestamp: string;
  title: string;
  participants: string;
  preview: string;
  isItalicPreview?: boolean;
  footerLabel?: string;
  footerBadge?: string;
  footerIcon?: string;
  unreadCount?: number;
}

interface FriendsResponse {
  friends: {
    id: string;
    username: string;
  }[];
}

export type MessageAttachment =
  | {
      type: "dish_card";
      id: string;
      badge: string;
      label: string;
      title: string;
      description: string;
      scheduledTime: string;
      imageUrl: string;
      confirmed?: boolean;
    }
  | {
      type: "sommelier_poll";
      id: string;
      title: string;
      totalVotes: number;
      options: {
        id: string;
        label: string;
        percentage: number;
        isSelected?: boolean;
      }[];
    }
  | {
      type: "voice_note";
      id: string;
      label: string;
      duration: string;
      caption: string;
      waveformHeights: number[];
      playedRatio?: number;
    };

export interface ChatMessage {
  id: string;
  senderName: string;
  senderInitials: string;
  senderRole?: string;
  isChefVerified?: boolean;
  isSommelier?: boolean;
  isOwn?: boolean;
  deliveryStatus?: "sent" | "delivered";
  timestamp: string;
  text?: string;
  attachment?: MessageAttachment;
}

interface BackendChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt?: string;
  created_at?: string;
}

function toChatMessage(
  message: BackendChatMessage,
  currentUserId: string | undefined,
  peerName: string,
  currentUserName: string,
): ChatMessage {
  const isOwn = message.senderId === currentUserId;
  const senderName = isOwn ? currentUserName : peerName;

  return {
    id: message.id,
    senderName,
    senderInitials: senderName.slice(0, 2).toUpperCase(),
    isOwn,
    deliveryStatus: isOwn ? "sent" : undefined,
    timestamp: new Date(message.createdAt ?? message.created_at ?? Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    text: message.text,
  };
}

export interface SalonDossier {
  serviceLabel: string;
  tableName: string;
  tableDetails: string;
  menuTitle: string;
  courseStatus: string;
  progressPercent: number;
  previousDish: {
    label: string;
    title: string;
    description: string;
    imageUrl: string;
    metrics: { label: string; value: string; highlight?: boolean }[];
  };
  members: {
    id: string;
    initials: string;
    name: string;
    role: string;
    isCurrentUser?: boolean;
    isGuestChef?: boolean;
  }[];
  directives: string[];
}

const salonApi = {
  async confirmDish(salonId: string, dishId: string): Promise<void> {
    void salonId;
    void dishId;
  },

  async voteSommelierPoll(salonId: string, pollId: string, optionId: string): Promise<void> {
    void salonId;
    void pollId;
    void optionId;
  },

  async exportMenuPdf(salonId: string): Promise<void> {
    void salonId;
  },

  async settleTableBill(salonId: string): Promise<void> {
    void salonId;
  },
};

const INITIAL_THREADS: SalonThread[] = [];

const INITIAL_MESSAGES: ChatMessage[] = [];

export default function EpicureSalonWorkspace() {
  const { status, messages: wsMessages, sendMessage, reconnect } = useWebSocket();
  const { user } = useAuth();

  const [threads, setThreads] = useState<SalonThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    INITIAL_THREADS[0]?.id ?? null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [showThreadInfo, setShowThreadInfo] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTypingIndicator = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
  };

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch("/api/friends");
        if (!response.ok) {
          throw new Error(`Unable to load friends: ${response.status}`);
        }

        const friendsResponse: FriendsResponse = await response.json();
        const salonThreads: SalonThread[] = friendsResponse.friends.map((friend) => ({
          id: friend.id,
          category: "CONVERSACIÓN",
          timestamp: "AHORA",
          title: friend.username,
          participants: friend.username,
          preview: "Inicia una conversación",
        }));

        if (salonThreads.length > 0) {
          setThreads(salonThreads);
          setActiveThreadId(salonThreads[0].id);
        } else {
          setThreads([]);
          setActiveThreadId(null);
        }
      } catch (error) {
        console.error("Error al recuperar las conversaciones", error);
      }
    };

    fetchThreads();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeThreadId) {
        setMessages([]);
        return;
      }

      try {
        const response = await fetch(`/api/message/${activeThreadId}`);
        if (!response.ok) {
          throw new Error(`Unable to load messages: ${response.status}`);
        }

        const backendMessages: BackendChatMessage[] = await response.json();
        const peerName = threads.find((thread) => thread.id === activeThreadId)?.title ?? "Usuario";
        setMessages(backendMessages.map((message) => (
          toChatMessage(message, user?.id, peerName, user?.username ?? "Tú")
        )));
      } catch (error) {
        console.error("Error al recuperar los mensajes", error);
      }
    };

    fetchMessages();
  }, [activeThreadId, threads, user?.id, user?.username]);

  useEffect(() => {
    if (status !== 'open' || wsMessages.length <= 0) return;

    try {
      const lastMessage: {
        event: string;
        data?: BackendChatMessage & { isTyping?: boolean; messageId?: string };
      } = JSON.parse(wsMessages[wsMessages.length - 1].data);

      if (lastMessage.event === 'chat:delivered' && lastMessage.data?.messageId) {
        setMessages((prev) => prev.map((message) => (
          message.id === lastMessage.data?.messageId
            ? { ...message, deliveryStatus: "delivered" }
            : message
        )));
      }

      if (
        lastMessage.event === 'chat:receive' &&
        lastMessage.data &&
        ((lastMessage.data.senderId === activeThreadId && lastMessage.data.receiverId === user?.id) ||
          (lastMessage.data.senderId === user?.id && lastMessage.data.receiverId === activeThreadId))
      ) {
        const peerName = threads.find((thread) => thread.id === activeThreadId)?.title ?? "Usuario";
        setMessages((prev) => [
          ...prev,
          toChatMessage(lastMessage.data!, user?.id, peerName, user?.username ?? "Tú"),
        ]);
      }

      if (lastMessage.event === 'chat:typing' && lastMessage.data?.senderId === activeThreadId) {
        const currentlyTyping = lastMessage.data.isTyping === true;
        setIsTyping(currentlyTyping);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        if (currentlyTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            typingTimeoutRef.current = null;
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Error al procesar el mensaje entrante", err);
    }
  }, [wsMessages, status, activeThreadId, threads, user?.id, user?.username]);

  useEffect(() => {
    stopTypingIndicator();
    return stopTypingIndicator;
  }, [activeThreadId]);

  const activeThread = useMemo(() => {
    return threads.find((thread) => thread.id === activeThreadId) ?? null;
  }, [threads, activeThreadId]);

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;

    return threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(query) ||
        thread.participants.toLowerCase().includes(query) ||
        thread.preview.toLowerCase().includes(query)
    );
  }, [threads, searchQuery]);

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || isSending || !activeThreadId) return;

    setIsSending(true);
    try {
      sendMessage({ event: "chat:typing", data: { receiverId: activeThreadId, isTyping: false } });
      const sent = sendMessage({ event: "chat:message", data: { receiverId: activeThreadId, text: content } });
      if (!sent) {
        throw new Error("WebSocket unavailable");
      }
      setDraft("");
      stopTypingIndicator();
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      setNotice("No se pudo enviar el mensaje. Comprueba tu conexión.");
    } finally {
      setIsSending(false);
    }
  };

  const handleStartConversation = () => {
    const id = `conversation-${Date.now()}`;
    const newThread: SalonThread = {
      id,
      category: "ATENCIÓN",
      timestamp: "AHORA",
      title: "Nueva conversación",
      participants: "Equipo Épicure",
      preview: "Escribe tu primer mensaje",
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
    setMessages([]);
    setNotice(null);
  };

  const handleArchiveThread = () => {
    if (!activeThreadId) return;
    const nextThreads = threads.filter((thread) => thread.id !== activeThreadId);
    setThreads(nextThreads);
    setActiveThreadId(nextThreads[0]?.id ?? null);
    setMessages([]);
    setNotice("Conversación archivada");
  };

  const handleAttachment = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraft((current) => `${current}${current ? " " : ""}[Archivo: ${file.name}]`);
    event.target.value = "";
  };

  const handleVoiceNote = () => {
    setNotice("La nota de voz estará disponible próximamente");
  };

  const handleConfirmDish = async (dishId: string) => {
    if (!activeThreadId) return;
    try {
      await salonApi.confirmDish(activeThreadId, dishId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.attachment?.type === "dish_card" && msg.attachment.id === dishId
            ? { ...msg, attachment: { ...msg.attachment, confirmed: true } }
            : msg
        )
      );
    } catch (error) {
      console.error("Error al confirmar el plato:", error);
      setNotice("No se pudo confirmar el plato");
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!activeThreadId) return;
    try {
      await salonApi.voteSommelierPoll(activeThreadId, pollId, optionId);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.attachment?.type !== "sommelier_poll" || msg.attachment.id !== pollId) return msg;
          return {
            ...msg,
            attachment: {
              ...msg.attachment,
              options: msg.attachment.options.map((opt) => ({
                ...opt,
                isSelected: opt.id === optionId,
              })),
            },
          };
        })
      );
    } catch (error) {
      console.error("Error al votar en la encuesta:", error);
      setNotice("No se pudo registrar tu voto");
    }
  };

  return (
    <AppLayout
      isSaved={isSaved}
      onToggleSaved={() => {
        setIsSaved((current) => !current);
        setNotice(isSaved ? "Eliminado de guardados" : "Guardado");
      }}
    >
        {notice && (
          <div
            role="status"
            className="flex items-center justify-center gap-3 border-b border-[#fabc4d]/20 bg-[#211f1e] px-6 py-2 text-[11px] text-[#fabc4d]"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-[#a88a83] underline hover:text-[#e6e1df]"
            >
              Cerrar
            </button>
          </div>
        )}

        <main className="grid flex-1 grid-cols-12 bg-[#0f0e0d]">
          <section className="col-span-3 flex flex-col justify-between border-r border-white/5 bg-[#1d1b1a]/95">
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-2 border-b border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
                      BANDEJA DE ENTRADA
                    </p>
                    <h1 className="text-[20px] tracking-[-0.5px] text-[#e6e1df]">Mensajes</h1>
                  </div>
                  <button
                    type="button"
                    aria-label="Nueva conversación"
                    onClick={handleStartConversation}
                    className="flex size-8 items-center justify-center border border-white/5 bg-[#211f1e] hover:border-[#fabc4d]/40"
                  >
                    <Plus aria-hidden="true" className="size-3" strokeWidth={1.75} />
                  </button>
                </div>

                <p className="text-[12px] leading-4 tracking-[0.3px] text-[#a88a83]">
                  Habla directamente con el equipo y gestiona tus reservas
                </p>

                <div className="relative mt-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="text"
                    aria-label="Buscar una conversación"
                    placeholder="Buscar conversación..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-white/5 bg-[#0f0e0d]/80 py-2 pr-3 pl-8 text-[12px] text-[#e6e1df] outline-none placeholder:text-[#a88a83] focus:border-[#fabc4d]/40"
                  />
                </div>
              </div>

              {filteredThreads.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-white/10 bg-[#211f1e] text-[#fabc4d]">
                    <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  </div>
                  <p className="text-[15px] text-[#e6e1df]">
                    {searchQuery.trim()
                      ? "No se encontraron resultados"
                      : "No hay conversaciones"}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#a88a83]">
                    {searchQuery.trim()
                      ? "Prueba con otro término de búsqueda."
                      : "Cuando inicies un chat con el restaurante, aparecerá aquí."}
                  </p>
                </div>
              ) : (
                <div className="flex max-h-[600px] flex-1 flex-col overflow-y-auto">
                  {filteredThreads.map((thread) => {
                    const isSelected = thread.id === activeThreadId;
                    return (
                      <article
                        key={thread.id}
                        onClick={() => setActiveThreadId(thread.id)}
                        className={`cursor-pointer border-b border-white/5 p-3 transition-colors ${
                          isSelected
                            ? "border-l-2 border-l-[#fabc4d] bg-[#211f1e] pl-3.5"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] tracking-[1px]">
                          <div className="flex items-center gap-2">
                            {thread.isLive && (
                              <span className="size-1.5 rounded-full bg-[#fabc4d] shadow-[0_0_6px_rgba(250,188,77,0.9)]" />
                            )}
                            <span
                              className={`uppercase ${
                                thread.isGoldCategory ? "text-[#fabc4d]" : "text-[#a88a83]"
                              }`}
                            >
                              {thread.category}
                            </span>
                          </div>
                          <span className="text-[#a88a83]">{thread.timestamp}</span>
                        </div>

                        <h2 className="mt-1 text-[15px] leading-snug text-[#e6e1df]">
                          {thread.title}
                        </h2>
                        <p className="text-[12px] text-[#59413b]">{thread.participants}</p>

                        <p
                          className={`mt-1 text-[13px] leading-5 ${
                            thread.isItalicPreview ? "italic text-[#e0bfb7]" : "text-[#a88a83]"
                          }`}
                        >
                          {thread.preview}
                        </p>

                        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                          {thread.footerBadge ? (
                            <span className="bg-[#211f1e] px-1.5 py-0.5 text-[9px] tracking-[0.9px] text-[#fabc4d] uppercase">
                              {thread.footerBadge}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {thread.footerIcon && (
                                <img alt="" className="h-[11px] w-auto" src={thread.footerIcon} />
                              )}
                              <span className="text-[10px] tracking-[0.5px] text-[#a88a83] uppercase">
                                {thread.footerLabel}
                              </span>
                            </div>
                          )}

                          {thread.unreadCount ? (
                            <span className="flex size-4 items-center justify-center rounded-full bg-[#fabc4d] text-[9px] font-bold text-[#0f0e0d]">
                              {thread.unreadCount}
                            </span>
                          ) : (
                            thread.footerBadge &&
                            thread.footerIcon && (
                              <img alt="" className="h-[11px] w-auto" src={thread.footerIcon} />
                            )
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="col-span-9 flex flex-col justify-between bg-[#141312]">
            {!activeThread ? (
              /* ÉTAT VIDE : AUCUNE CONVERSATION SÉLECTIONNÉE */
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="flex size-16 items-center justify-center border border-[#fabc4d]/20 bg-[#1d1b1a] shadow-lg">
                  <MessageCircle aria-hidden="true" className="size-7" strokeWidth={1.25} />
                </div>
                <span className="mt-4 text-[10px] font-bold tracking-[2px] text-[#fabc4d] uppercase">
                  MENSAJERÍA DIRECTA
                </span>
                <h2 className="mt-1 text-[24px] text-[#e6e1df]">
                  Ninguna conversación seleccionada
                </h2>
                <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[#a88a83]">
                  Selecciona un chat en la lista de la izquierda o inicia una nueva conversación
                  para hablar con el equipo del restaurante.
                </p>
              </div>
            ) : (
              /* CONVERSATION SÉLECTIONNÉE */
              <>
                <div className="flex items-start justify-between border-b border-white/5 bg-[#141312]/90 p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-[40px] w-[24px] items-center justify-center border border-[#fabc4d]/30 bg-[#211f1e]">
                      <MessageCircle aria-hidden="true" className="size-4 text-[#fabc4d]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#ef6540]/20 px-1.5 py-0.5 text-[9px] tracking-[0.9px] text-[#ffb4a1] uppercase">
                          CHAT DIRECTO
                        </span>
                        <span className="text-[10px] tracking-[1px] text-[#fabc4d] uppercase">
                          • {activeThread.category}
                        </span>
                      </div>
                      <h2 className="mt-1 text-[24px] leading-[30px] tracking-[-0.6px] text-[#e6e1df]">
                        {activeThread.title}
                      </h2>
                      <p className="mt-0.5 text-[12px] text-[#a88a83]">
                        {activeThread.participants}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Fijar"
                      aria-pressed={isPinned}
                      onClick={() => {
                        setIsPinned((current) => !current);
                        setNotice(isPinned ? "Conversación desfijada" : "Conversación fijada");
                      }}
                      className="flex size-8 items-center justify-center border border-white/5 bg-[#211f1e] hover:border-white/20"
                    >
                      <Pin
                        aria-hidden="true"
                        className={`size-3.5 ${isPinned ? "fill-[#fabc4d] text-[#fabc4d]" : ""}`}
                        strokeWidth={1.5}
                      />
                    </button>
                    <button
                      type="button"
                      aria-label="Información"
                      aria-pressed={showThreadInfo}
                      onClick={() => setShowThreadInfo((current) => !current)}
                      className="flex size-8 items-center justify-center border border-white/5 bg-[#211f1e] hover:border-white/20"
                    >
                      <Info aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={handleArchiveThread}
                      className="flex items-center gap-1.5 border border-[#fabc4d]/20 bg-[#211f1e] px-3 py-1.5 text-[10px] tracking-[1px] text-[#fabc4d] uppercase hover:bg-[#fabc4d]/10"
                    >
                      <Archive aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                      <span>ARCHIVAR</span>
                    </button>
                  </div>
                </div>
                {showThreadInfo && (
                  <div className="border-b border-white/5 bg-[#1d1b1a] px-6 py-3 text-[12px] text-[#a88a83]">
                    <span className="text-[#fabc4d]">Participantes:</span>{" "}
                    {activeThread.participants}
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-[16px] text-[#e6e1df]">No hay mensajes todavía</p>
                      <p className="mt-1 max-w-xs text-[13px] text-[#a88a83]">
                        Escribe un mensaje abajo para empezar la conversación.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="py-2 text-center">
                        <span className="text-[10px] tracking-[2px] text-[#a88a83] uppercase">
                          — INICIO DE LA CONVERSACIÓN —
                        </span>
                      </div>

                      {messages.map((msg) => {
                        if (msg.attachment?.type === "dish_card") {
                          const dish = msg.attachment;
                          return (
                            <div key={msg.id} className="max-w-[620px] pl-11">
                              <div className="grid grid-cols-12 border border-white/10 bg-[#211f1e] shadow-xl">
                                <div className="relative col-span-5 min-h-[240px] overflow-hidden bg-[#363433]">
                                  <img
                                    alt={dish.title}
                                    className="size-full object-cover"
                                    src={dish.imageUrl}
                                  />
                                  <span className="absolute top-2 left-2 border border-[#fabc4d]/20 bg-[#0f0e0d]/80 px-2 py-0.5 text-[8px] tracking-[0.8px] text-[#fabc4d] uppercase backdrop-blur-xs">
                                    {dish.badge}
                                  </span>
                                </div>

                                <div className="col-span-7 flex flex-col justify-between p-4">
                                  <div className="pt-1">
                                    <p className="text-[9px] tracking-[1.8px] text-[#fabc4d] uppercase">
                                      {dish.label}
                                    </p>
                                    <h3 className="mt-1 text-[18px] leading-snug text-[#e6e1df]">
                                      {dish.title}
                                    </h3>
                                    <p className="mt-1.5 text-[13px] leading-relaxed text-[#a88a83]">
                                      {dish.description}
                                    </p>
                                  </div>

                                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                                    <div className="text-[10px] text-[#a88a83]">
                                      <p>Hora prevista:</p>
                                      <p>{dish.scheduledTime}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => void handleConfirmDish(dish.id)}
                                      disabled={dish.confirmed}
                                      className="bg-[#ef6540] px-6 py-1.5 text-[10px] tracking-[0.5px] text-[#611300] uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                      {dish.confirmed ? "PLATO CONFIRMADO" : "CONFIRMAR PLATO"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (msg.attachment?.type === "sommelier_poll") {
                          const poll = msg.attachment;
                          return (
                            <div key={msg.id} className="max-w-[556px] pl-11">
                              <div className="flex flex-col gap-3 border border-[#fabc4d]/20 bg-[#1d1b1a] p-4 shadow-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Wine aria-hidden="true" className="size-3 text-[#fabc4d]" strokeWidth={1.5} />
                                    <span className="text-[10px] tracking-[1px] text-[#fabc4d] uppercase">
                                      {poll.title}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-[#a88a83] uppercase">
                                    {poll.totalVotes} VOTOS
                                  </span>
                                </div>

                                <div className="flex flex-col gap-2">
                                  {poll.options.map((opt) => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => void handleVotePoll(poll.id, opt.id)}
                                      className={`flex w-full items-center justify-between border p-2.5 text-left transition-colors ${
                                        opt.isSelected
                                          ? "border-[#fabc4d]/40 bg-[#211f1e]"
                                          : "border-white/5 bg-[#211f1e]/50 hover:border-white/15"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`flex size-3.5 items-center justify-center rounded-full border bg-white ${
                                            opt.isSelected ? "border-[#ffb4a1]" : "border-[#767676]"
                                          }`}
                                        >
                                          {opt.isSelected && (
                                            <span className="size-2 rounded-full bg-[#ffb4a1]" />
                                          )}
                                        </span>
                                        <span className="text-[12px] text-[#e6e1df]">
                                          {opt.label}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-[10px] ${
                                          opt.isSelected
                                            ? "font-bold text-[#fabc4d]"
                                            : "text-[#a88a83]"
                                        }`}
                                      >
                                        {opt.isSelected
                                          ? `Seleccionado ${opt.percentage}%`
                                          : `${opt.percentage}%`}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (msg.attachment?.type === "voice_note") {
                          const voice = msg.attachment;
                          const activeBars = Math.round(
                            voice.waveformHeights.length * (voice.playedRatio ?? 0.5)
                          );
                          return (
                            <div key={msg.id} className="flex max-w-[436px] items-start gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center border border-white/10 bg-[#2b2a28] text-[14px] text-[#fabc4d]">
                                {msg.senderInitials}
                              </div>
                              <div className="flex flex-1 flex-col gap-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-[12px] font-bold text-[#e6e1df]">
                                    {msg.senderName}
                                  </span>
                                  <span className="text-[9px] text-[#a88a83]">{msg.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-3 border border-white/5 bg-[#1d1b1a] p-3">
                                  <button
                                    type="button"
                                    aria-label="Reproducir nota de voz"
                                    className="flex size-8 shrink-0 items-center justify-center bg-[#ffb4a1]"
                                  >
                                    <Play aria-hidden="true" className="size-3.5 text-[#611300]" fill="currentColor" strokeWidth={1.5} />
                                  </button>
                                  <div className="flex flex-1 flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] tracking-[0.9px] text-[#fabc4d] uppercase">
                                        {voice.label}
                                      </span>
                                      <span className="text-[9px] text-[#a88a83]">
                                        {voice.duration}
                                      </span>
                                    </div>
                                    <div className="flex h-4 items-center gap-0.5">
                                      {voice.waveformHeights.map((h, idx) => (
                                        <span
                                          key={idx}
                                          style={{ height: `${h}px` }}
                                          className={`w-1 rounded-full ${
                                            idx < activeBars ? "bg-[#fabc4d]" : "bg-white/20"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <span className="pl-1 text-[9px] text-[#a88a83]">
                                  {voice.caption}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-3 ${
                              msg.isOwn
                                ? "ml-auto max-w-[436px] flex-row-reverse"
                                : "max-w-[436px]"
                            }`}
                          >
                            <div className="relative shrink-0">
                              <div
                                className={`flex size-9 items-center justify-center text-[13px] ${
                                  msg.isOwn
                                    ? "bg-[#ffb4a1] font-bold text-[#611300]"
                                    : msg.isSommelier
                                    ? "border border-[#fabc4d]/30 bg-[#2b2a28] text-[#fabc4d]"
                                    : "border border-white/10 bg-[#2b2a28] text-[#fabc4d]"
                                }`}
                              >
                                {msg.senderInitials}
                              </div>
                              {msg.isChefVerified && (
                                <BadgeCheck
                                  aria-label="Chef verificado"
                                  className="absolute -right-1 -bottom-1 size-3.5"
                                  strokeWidth={2}
                                />
                              )}
                            </div>

                            <div
                              className={`flex flex-col gap-1 ${
                                msg.isOwn ? "items-end" : "items-start"
                              }`}
                            >
                              <div className="flex items-baseline gap-2">
                                {msg.isOwn ? (
                                  <>
                                    <span className="text-[9px] text-[#a88a83]">
                                      {msg.timestamp}
                                    </span>
                                    {msg.senderRole && (
                                      <span className="text-[9px] tracking-[0.45px] text-[#ffb4a1] uppercase">
                                        {msg.senderRole}
                                      </span>
                                    )}
                                    <span className="text-[12px] font-bold text-[#e6e1df]">
                                      {msg.senderName}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[12px] font-bold text-[#e6e1df]">
                                      {msg.senderName}
                                    </span>
                                    {msg.senderRole && (
                                      <span className="text-[9px] tracking-[0.45px] text-[#fabc4d] uppercase">
                                        {msg.senderRole}
                                      </span>
                                    )}
                                    <span className="text-[9px] text-[#a88a83]">
                                      {msg.timestamp}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div
                                className={`border p-4 text-[15px] leading-[24.38px] text-[#e6e1df] shadow-md ${
                                  msg.isOwn
                                    ? "border-[#ef6540]/30 bg-[#ef6540]/15"
                                    : "border-white/5 bg-[#1d1b1a]"
                                }`}
                              >
                                <p>{msg.text}</p>
                                {msg.isOwn && msg.deliveryStatus && (
                                  <span className="mt-1 block text-right text-[9px] tracking-[0.5px] text-[#a88a83] uppercase">
                                    {msg.deliveryStatus}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <form
                  onSubmit={(e) => void handleSendMessage(e)}
                  className="border-t border-white/5 bg-[#0f0e0d]/90 p-4 backdrop-blur-sm"
                >
                  <div className="flex flex-col gap-2 border border-white/5 bg-[#211f1e] p-2.5">
                    <div className="flex items-center justify-between px-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#fabc4d]" />
                        <span className="text-[9px] tracking-[0.9px] text-[#fabc4d] uppercase">
                          NUEVO MENSAJE
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Nota de voz"
                          onClick={handleVoiceNote}
                          className="hover:opacity-80"
                        >
                          <Mic aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label="Adjuntar imagen"
                          onClick={() => imageInputRef.current?.click()}
                          className="hover:opacity-80"
                        >
                          <Image aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label="Adjuntar archivo"
                          onClick={() => fileInputRef.current?.click()}
                          className="hover:opacity-80"
                        >
                          <Paperclip aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAttachment}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleAttachment}
                    />

                    <textarea
                      rows={2}
                      aria-label="Escribe un mensaje"
                      placeholder="Escribe un mensaje..."
                      value={draft}
                      onChange={(e) => {
                        const nextDraft = e.target.value;
                        setDraft(nextDraft);

                        if (!activeThreadId) return;
                        sendMessage({
                          event: "chat:typing",
                          data: { receiverId: activeThreadId, isTyping: nextDraft.trim().length > 0 },
                        });
                      }}
                      onBlur={() => {
                        if (activeThreadId) {
                          sendMessage({
                            event: "chat:typing",
                            data: { receiverId: activeThreadId, isTyping: false },
                          });
                        }
                      }}
                      className="w-full resize-none bg-transparent px-2 py-1 text-[13px] leading-5 text-[#e6e1df] outline-none placeholder:text-[#a88a83]/70"
                    />

                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="pl-2 text-[9px] tracking-[0.45px] text-[#a88a83] uppercase">
                        {isTyping ? "ESCRIBIENDO..." : "CHAT ACTIVO"}
                      </span>

                      <button
                        type="submit"
                        disabled={isSending || !draft.trim()}
                        className="flex items-center gap-2 bg-[#ef6540] px-4 py-1.5 text-[14px] tracking-[0.35px] text-[#611300] shadow-[0_2px_6px_rgba(239,101,64,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span>Enviar mensaje</span>
                        <Send aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </section>
        </main>
    </AppLayout>
  );
}