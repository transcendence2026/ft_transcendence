import { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { ImageDropzone } from "../components/ImageDropzone";
import { Loader } from "../components/Loader";
import { SocialPostCard } from "../components/SocialPostCard";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import AppLayout, { SidebarAccount } from "../components/AppLayout";

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? "http://localhost:3000" : "");

interface FeedPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; profile?: { avatarUrl: string | null } | null };
  images: { id: string; url: string }[];
  friendship: { status: string; requestId: string | null };
}

interface FeedResponse {
  items: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

const placeholderPosts: FeedPost[] = [
  {
    id: "placeholder-1",
    title: "El feed está listo para tu mesa",
    content:
      "Aún no hay publicaciones disponibles. Comparte tu próximo plato con la comunidad y aparecerá aquí.",
    createdAt: new Date().toISOString(),
    author: { id: "placeholder-author", username: "transcendence", profile: null },
    images: [],
    friendship: { status: "SELF", requestId: null },
  },
];
type CreatedPost = Omit<FeedPost, "friendship">;

function formatDate(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function imageUrl(url: string) {
  return url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(post.friendship?.status ?? "NONE");
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const navigate = useNavigate();
  const isPlaceholder = post.id.startsWith("placeholder-") || post.id === "placeholder-1";

  const addFriend = async () => {
    setFriendshipLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/friends/requests/${post.author.id}`);
      setFriendshipStatus("PENDING");
    } finally {
      setFriendshipLoading(false);
    }
  };

  return (
    <article className="border border-white/5 bg-[#1d1b1a] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Avatar
            name={post.author.username}
            src={post.author.profile?.avatarUrl ? imageUrl(post.author.profile.avatarUrl) : null}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="truncate text-left text-sm font-semibold text-[#e6e1df] hover:text-[#fabc4d]"
                onClick={() => navigate(`/profile/${post.author.id}`)}
              >
                {post.author.username}
              </button>
              <Badge tone="muted">{isPlaceholder ? "welcome" : post.title.split(" ")[0]}</Badge>
            </div>
            <p className="mt-1 text-xs text-[#a88a83]">
              @{post.author.username} <span className="px-1">·</span> {formatDate(post.createdAt)}
            </p>
          </div>
        </div>
        {(friendshipStatus === "NONE" || friendshipStatus === "DECLINED") && !isPlaceholder && (
          <Button
            type="button"
            variant="ghost"
            disabled={friendshipLoading}
            onClick={() => void addFriend()}
            className="px-2 py-1 text-xs text-[#ffb4a1]"
          >
            {friendshipLoading ? "..." : "+ Amigo"}
          </Button>
        )}
        {friendshipStatus === "PENDING" && <Badge tone="muted">Solicitud enviada</Badge>}
        {friendshipStatus === "ACCEPTED" && <Badge tone="success">Amigos</Badge>}
      </div>
      <div className="mt-5">
        <h2 className="text-xl text-[#e6e1df]">{post.title}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#a88a83]">{post.content}</p>
      </div>
      {post.images.length > 0 && (
        <div className={`mt-5 grid gap-2 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {post.images.slice(0, 4).map((image) => (
            <img
              key={image.id}
              src={imageUrl(image.url)}
              alt={`Plato compartido por ${post.author.username}`}
              className="aspect-[4/3] w-full object-cover"
            />
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center gap-5 border-t border-white/5 pt-4 text-xs text-[#a88a83]">
        <Button
          type="button"
          variant="ghost"
          aria-pressed={liked}
          onClick={() => setLiked((value) => !value)}
          className={`px-0 py-0 text-xs ${liked ? "text-[#ffb4a1]" : "text-[#a88a83]"}`}
        >
          {liked ? "♥" : "♡"} {liked ? 1 : 0}
        </Button>
        <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-[#a88a83]">
          □ 0
        </Button>
        <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-[#a88a83]">
          ↗ Compartir
        </Button>
      </div>
    </article>
  );
}

function DashboardContent() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { sendMessage, messages } = useWebSocket();
  void sendMessage;
  void messages;
  const username = user?.username ?? "Usuario";

  // Estados para el flujo de activación del 2FA
  const [show2FaModal, setShow2FaModal] = useState<boolean>(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [loading2Fa, setLoading2Fa] = useState<boolean>(false);

  // Estados para la desactivación del 2FA
  const [showDisableModal, setShowDisableModal] = useState<boolean>(false);
  const [disableCode, setDisableCode] = useState<string>("");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<FeedPost[]>(placeholderPosts);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingPlaceholder, setUsingPlaceholder] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImageUrl, setPostImageUrl] = useState("");
  const [imageSource, setImageSource] = useState<"upload" | "url">("upload");
  const [postImageKey, setPostImageKey] = useState(0);
  const [postImageProgress, setPostImageProgress] = useState(0);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const rosterNames = [
    "Chef Nicolas Laurent",
    "Elena Rostova",
    "Maison Allar",
    "Atelier Noma",
    "Ginza Shin",
  ];

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    let cancelled = false;
    void axios
      .get<FeedResponse>(`${API_BASE_URL}/api/social/feed?limit=8`, {
        validateStatus: (status) => status < 500,
      })
      .then(({ data, status }) => {
        if (cancelled) return;
        if (status >= 400 || !data.items?.length) {
          setPosts(placeholderPosts);
          setUsingPlaceholder(true);
          setHasMore(false);
          return;
        }
        setPosts(data.items);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
        setUsingPlaceholder(false);
      })
      .catch(() => {
        if (!cancelled) {
          setPosts(placeholderPosts);
          setUsingPlaceholder(true);
          setHasMore(false);
          setError("El feed en directo no está disponible en este momento.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore || usingPlaceholder || !cursor) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoadingMore(true);
        void axios
          .get<FeedResponse>(
            `${API_BASE_URL}/api/social/feed?limit=8&cursor=${encodeURIComponent(cursor)}`
          )
          .then(({ data }) => {
            setPosts((current) => [...current, ...data.items]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
          })
          .catch(() => setError("No se pudieron cargar más publicaciones."))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "320px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadingMore, usingPlaceholder]);

  const handleCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = postTitle.trim();
    const content = postContent.trim();
    if (!title || !content) {
      setPostError("Add a title and something to share.");
      return;
    }

    setPosting(true);
    setPostError(null);
    try {
      let imageUrl: string | undefined;
      if (imageSource === "upload" && postImage) {
        const formData = new FormData();
        formData.append("file", postImage);
        const uploadResponse = await axios.post<{ url: string }>(
          `${API_BASE_URL}/api/files/post`,
          formData,
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                setPostImageProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
              }
            },
          },
        );
        imageUrl = uploadResponse.data.url;
      } else if (imageSource === "url" && postImageUrl.trim()) {
        imageUrl = postImageUrl.trim();
      }

      const { data } = await axios.post<CreatedPost>(`${API_BASE_URL}/api/social/posts`, {
        title,
        content,
        ...(imageUrl ? { imageUrls: [imageUrl] } : {}),
      });
      const newPost: FeedPost = {
        ...data,
        friendship: { status: "SELF", requestId: null },
      };
      setPosts((current) => [newPost, ...current.filter((post) => !post.id.startsWith("placeholder-"))]);
      setUsingPlaceholder(false);
      setPostTitle("");
      setPostContent("");
      setPostImage(null);
      setPostImageUrl("");
      setImageSource("upload");
      setPostImageProgress(0);
      setPostImageKey((key) => key + 1);
      setShowPostComposer(false);
    } catch (requestError: any) {
      setPostError(requestError.response?.data?.message || "Your post could not be published.");
    } finally {
      setPosting(false);
    }
  };

  // Paso 1: Pedir el QR a NestJS
  const handleStart2FA = async () => {
    setErrorMessage("");
    setLoading2Fa(true);
    try {
      const response = await axios.post<{ secret: string; qrCodeImage: string }>(
        `${API_BASE_URL}/api/auth/2fa/generate`
      );
      setQrCodeImage(response.data.qrCodeImage);
      setSecret(response.data.secret);
      setShow2FaModal(true);
    } catch (err: any) {
      console.error("Error al generar el 2FA:", err);
      setErrorMessage("No se pudo generar el código QR. Inténtalo de nuevo.");
    } finally {
      setLoading2Fa(false);
    }
  };

  // Paso 2: Enviar los 6 dígitos a NestJS para activar
  const handleConfirm2FA = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (twoFactorCode.length !== 6) {
      setErrorMessage("Introduce el código de 6 dígitos.");
      return;
    }

    setLoading2Fa(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/2fa/turn-on`, {
        code: twoFactorCode,
      });

      setIsSuccess(true);
      await refreshUser();

      setTimeout(() => {
        setShow2FaModal(false);
        setIsSuccess(false);
        setTwoFactorCode("");
      }, 2000);
    } catch (err: any) {
      console.error("Error al activar 2FA:", err);
      setErrorMessage("Código incorrecto. Vuelve a intentarlo.");
    } finally {
      setLoading2Fa(false);
    }
  };

  // Paso 3: Para desactivar 2FA, enviar a NestJS el código de 6 dígitos
  const handleDisable2FA = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (disableCode.length !== 6) {
      setErrorMessage("Introduce el código de 6 dígitos.");
      return;
    }

    setLoading2Fa(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/2fa/turn-off`, {
        code: disableCode,
      });

      setIsSuccess(true);
      await refreshUser();
      setTimeout(() => {
        setShowDisableModal(false);
        setIsSuccess(false);
        setDisableCode("");
      }, 2000);
    } catch (err: any) {
      console.error("Error al desactivar 2FA:", err);
      setErrorMessage(
        err.response?.data?.message || "Código incorrecto. No se pudo desactivar el 2FA."
      );
    } finally {
      setLoading2Fa(false);
    }
  };

  return (
    <AppLayout sidebarFooter={<SidebarAccount onLogout={() => void handleLogout()} />}>
        <main className="grid flex-1 grid-cols-12 bg-[#0f0e0d]">
          {/* COLONNE CENTRALE (8 cols) : FEED CULINAIRE */}
          <section className="col-span-12 flex flex-col border-r border-white/5 bg-[#141312] p-6 lg:col-span-8">
            <div className="mb-6 flex items-end justify-between border-b border-white/5 pb-5">
              <div>
                <p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
                  COMUNIDAD GASTRONÓMICA
                </p>
                <h1 className="mt-1 text-[28px] tracking-[-0.5px] text-[#e6e1df]">
                  Bienvenido de nuevo, {username}
                </h1>
              </div>
              <button
                type="button"
                className="hidden items-center gap-2 border border-white/10 bg-[#211f1e] px-3 py-2 text-[11px] tracking-[1px] text-[#a88a83] uppercase transition-colors hover:border-[#fabc4d]/40 hover:text-[#e6e1df] sm:flex"
              >
                <span>Ver archivo</span>
                <ArrowRight aria-hidden="true" className="size-3" strokeWidth={1.75} />
              </button>
            </div>

            {/* Roster des Chefs / Membres actifs */}
            <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {rosterNames.map((name, index) => {
                const post = posts[index];
                return (
                  <div
                    key={name}
                    className="flex flex-col items-center gap-2 border border-white/5 bg-[#1d1b1a] p-3 text-center"
                  >
                    <Avatar
                      name={post?.author.username ?? name}
                      src={
                        post?.author.profile?.avatarUrl
                          ? imageUrl(post.author.profile.avatarUrl)
                          : null
                      }
                      size="sm"
                    />
                    <p className="w-full truncate text-[12px] text-[#e6e1df]">{name}</p>
                    <span className="bg-[#211f1e] px-1.5 py-0.5 text-[9px] tracking-[0.8px] text-[#fabc4d] uppercase">
                      {index === 0 ? "EN LÍNEA" : "COCINA"}
                    </span>
                  </div>
                );
              })}
            </div>

          <div className="scrollbar-hidden min-h-0 flex-1 space-y-4 overflow-y-auto pb-8 pr-1">
            <div className="rounded border border-border bg-surface p-4">
              {!showPostComposer ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPostError(null);
                    setShowPostComposer(true);
                  }}
                  className="w-full justify-start border border-border px-4 py-3 text-sm text-muted"
                >
                  Share something with the community...
                </Button>
              ) : (
                <form onSubmit={handleCreatePost} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-primary-soft">{username.slice(0, 2).toUpperCase()}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        if (!posting) {
                          setShowPostComposer(false);
                          setPostError(null);
                          setPostTitle("");
                          setPostContent("");
                          setPostImage(null);
                          setPostImageUrl("");
                          setImageSource("upload");
                          setPostImageProgress(0);
                          setPostImageKey((key) => key + 1);
                        }
                      }}
                      disabled={posting}
                      className="px-2 py-1 text-xs text-muted"
                    >
                      Cancel
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(event) => setPostTitle(event.target.value)}
                    maxLength={200}
                    placeholder="Post title"
                    aria-label="Post title"
                    className="w-full rounded border border-border bg-background px-4 py-2 text-sm text-text-strong placeholder-muted focus:border-primary focus:outline-none"
                  />
                  <textarea
                    value={postContent}
                    onChange={(event) => setPostContent(event.target.value)}
                    maxLength={10000}
                    placeholder="Share something with the community..."
                    aria-label="Post content"
                    rows={3}
                    className="w-full resize-y rounded border border-border bg-background px-4 py-3 text-sm text-text placeholder-muted focus:border-primary focus:outline-none"
                  />
                  <div className="space-y-3 rounded border border-border bg-background p-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={imageSource === "upload" ? "primary" : "ghost"}
                        onClick={() => {
                          setImageSource("upload");
                          setPostImageUrl("");
                        }}
                        className="px-3 py-1.5 text-xs"
                      >
                        Upload image
                      </Button>
                      <Button
                        type="button"
                        variant={imageSource === "url" ? "primary" : "ghost"}
                        onClick={() => {
                          setImageSource("url");
                          setPostImage(null);
                          setPostImageKey((key) => key + 1);
                          setPostImageProgress(0);
                        }}
                        className="px-3 py-1.5 text-xs"
                      >
                        Use image URL
                      </Button>
                    </div>
                    {imageSource === "upload" ? (
                      <ImageDropzone
                        key={postImageKey}
                        onFileSelect={(file) => {
                          setPostImage(file);
                          setPostImageUrl("");
                        }}
                        isUploading={posting && Boolean(postImage)}
                        uploadProgress={postImageProgress}
                        variant="post"
                      />
                    ) : (
                      <input
                        type="url"
                        value={postImageUrl}
                        onChange={(event) => {
                          setPostImageUrl(event.target.value);
                          setPostImage(null);
                        }}
                        placeholder="https://example.com/image.jpg"
                        aria-label="Image URL"
                        className="w-full rounded border border-border bg-surface px-4 py-2 text-sm text-text-strong placeholder-muted focus:border-primary focus:outline-none"
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {postError ? <p role="alert" className="text-xs text-red-400">{postError}</p> : <span />}
                    <Button type="submit" disabled={posting} className="shrink-0 px-4 py-2 text-xs">
                      {posting ? "Publishing..." : "Publish post"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Liste des publications */}
            <div className="space-y-5 pb-8">
              {loading ? (
                <Loader label="Cargando publicaciones..." />
              ) : (
                posts.map((post) => <SocialPostCard key={post.id} post={post} />)
              )}

              {error && (
                <p className="border border-[#ef6540]/30 bg-[#ef6540]/15 px-4 py-3 text-sm text-[#ffb4a1]">
                  {error}
                </p>
              )}

              {!loading && !usingPlaceholder && (
                <div ref={sentinelRef} className="min-h-20">
                  {loadingMore && <Loader label="Cargando más publicaciones..." />}
                </div>
              )}
            </div>
          </div>
          </section>

          {/* COLONNE DROITE (4 cols) : SÉCURITÉ 2FA & TENDANCES */}
          <aside className="col-span-12 flex flex-col gap-6 bg-[#1d1b1a]/95 p-6 lg:col-span-4">
            {/* PANNEAU 2FA */}
            <div className="border border-white/5 bg-[#211f1e] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      aria-hidden="true"
                      className="size-4 text-[#fabc4d]"
                      strokeWidth={1.5}
                    />
                    <span className="text-[10px] font-bold tracking-[1.5px] text-[#fabc4d] uppercase">
                      SEGURIDAD DE LA CUENTA
                    </span>
                  </div>
                  <h3 className="mt-1 text-[16px] text-[#e6e1df]">
                    Autenticación en Dos Pasos (2FA)
                  </h3>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#a88a83]">
                    {user?.isTwoFactorEnabled
                      ? "Tu cuenta está protegida con verificación en dos pasos."
                      : "Añade un código temporal para proteger el acceso a tu cuenta."}
                  </p>
                </div>

                {user?.isTwoFactorEnabled ? (
                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex shrink-0 items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] tracking-[0.8px] text-emerald-400 uppercase">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Activado
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage("");
                        setDisableCode("");
                        setShowDisableModal(true);
                        setShow2FaModal(false);
                      }}
                      className="border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-[10px] tracking-[0.5px] text-red-300 uppercase hover:bg-red-950/50"
                    >
                      Desactivar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={loading2Fa}
                    onClick={() => void handleStart2FA()}
                    className="shrink-0 bg-[#ef6540] px-3 py-1.5 text-[11px] tracking-[0.5px] text-[#611300] uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading2Fa ? "Cargando..." : "Activar"}
                  </button>
                )}
              </div>

              {/* Modal de Activación 2FA */}
              {show2FaModal && (
                <div className="mt-4 border border-white/5 bg-[#141312] p-4">
                  <h4 className="text-[14px] text-[#e6e1df]">
                    Configura tu aplicación Authenticator
                  </h4>
                  <p className="mt-1 text-[12px] text-[#a88a83]">
                    Escanea el código QR o introduce la clave manualmente.
                  </p>
                  {errorMessage && (
                    <div className="mt-3 border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-200">
                      {errorMessage}
                    </div>
                  )}
                  {isSuccess ? (
                    <div className="mt-4 border border-green-500/30 bg-green-950/40 p-3 text-center text-sm text-green-300">
                      ¡2FA activado correctamente!
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {qrCodeImage && (
                        <div className="mx-auto w-fit bg-white p-2">
                          <img src={qrCodeImage} alt="Código QR 2FA" className="h-36 w-36" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] tracking-[1px] text-[#a88a83] uppercase">
                          Clave secreta
                        </span>
                        <p className="mt-0.5 font-mono text-xs break-all text-[#ffb4a1] select-all">
                          {secret}
                        </p>
                      </div>
                      <form onSubmit={(e) => void handleConfirm2FA(e)} className="space-y-3">
                        <label className="block text-[10px] tracking-[1px] text-[#a88a83] uppercase">
                          Código de 6 dígitos
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="123456"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                            className="mt-1 w-full border border-white/10 bg-[#0f0e0d] px-3 py-2 text-center font-mono text-lg tracking-widest text-[#e6e1df] outline-none focus:border-[#fabc4d]"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-[#ef6540] py-2 text-[11px] tracking-[0.5px] text-[#611300] uppercase hover:opacity-90"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setShow2FaModal(false)}
                            className="border border-white/10 bg-[#211f1e] px-3 py-2 text-[11px] text-[#a88a83] uppercase hover:text-[#e6e1df]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Modal de Desactivación 2FA */}
              {showDisableModal && (
                <div className="mt-4 border border-white/5 bg-[#141312] p-4">
                  <h4 className="text-[14px] text-[#e6e1df]">Desactivar 2FA</h4>
                  <p className="mt-1 text-[12px] text-[#a88a83]">
                    Introduce el código de 6 dígitos de tu aplicación.
                  </p>
                  {errorMessage && (
                    <div className="mt-3 border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-200">
                      {errorMessage}
                    </div>
                  )}
                  {isSuccess ? (
                    <div className="mt-4 border border-green-500/30 bg-green-950/40 p-3 text-center text-sm text-green-300">
                      ¡2FA desactivado correctamente!
                    </div>
                  ) : (
                    <form onSubmit={(e) => void handleDisable2FA(e)} className="mt-4 space-y-3">
                      <label className="block text-[10px] tracking-[1px] text-[#a88a83] uppercase">
                        Código de 6 dígitos
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="123456"
                          autoFocus
                          value={disableCode}
                          onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                          className="mt-1 w-full border border-white/10 bg-[#0f0e0d] px-3 py-2 text-center font-mono text-lg tracking-widest text-[#e6e1df] outline-none focus:border-[#fabc4d]"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 border border-red-500/40 bg-red-950/60 py-2 text-[11px] tracking-[0.5px] text-red-200 uppercase hover:bg-red-900/60"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDisableModal(false)}
                          className="border border-white/10 bg-[#211f1e] px-3 py-2 text-[11px] text-[#a88a83] uppercase hover:text-[#e6e1df]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* COMUNIDAD */}
            <div className="border border-white/5 bg-[#211f1e] p-4">
              <p className="text-[10px] font-bold tracking-[2px] text-[#fabc4d] uppercase">
                PULSO DE LA COMUNIDAD
              </p>
              <h3 className="mt-1 text-[18px] text-[#e6e1df]">Aprender juntos</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#a88a83]">
                Comparte tus platos favoritos, descubre nuevas técnicas y conecta con otros
                apasionados de la cocina.
              </p>
            </div>
          </aside>
        </main>
    </AppLayout>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}