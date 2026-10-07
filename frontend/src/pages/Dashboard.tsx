import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Loader } from "../components/Loader";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";

const API_BASE_URL = "";


interface FeedPost {
	id: string;
	title: string;
	content: string;
	createdAt: string;
	author: { id: string; username: string; profile?: { avatarUrl: string | null } | null };
	images: { id: string; url: string }[];
}

interface FeedResponse { 
	items: FeedPost[]; 
	nextCursor: string | null; 
	hasMore: boolean; 
}

const placeholderPosts: FeedPost[] = [{
	id: "placeholder-1",
	title: "The feed is ready for your table",
	content: "No seeded publications are available yet. Share your next dish with the community and it will appear here.",
	createdAt: new Date().toISOString(),
	author: { id: "placeholder-author", username: "transcendence", profile: null },
	images: [],
}];

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

function PostCard({ post }: { post: FeedPost }) {
	const [liked, setLiked] = useState(false);
	const isPlaceholder = post.id.startsWith("placeholder-") || post.id === "placeholder-1";
	return (
		<article className="feed-post rounded border border-border bg-surface p-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 gap-3">
					<Avatar 
						name={post.author.username} 
						src={post.author.profile?.avatarUrl ? imageUrl(post.author.profile.avatarUrl) : null} 
						size="sm" 
					/>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<p className="truncate text-sm font-semibold text-text-strong">{post.author.username}</p>
							<Badge tone="muted">{isPlaceholder ? "welcome" : post.title.split(" ")[0]}</Badge>
						</div>
						<p className="mt-1 text-xs text-muted">
							@{post.author.username} <span className="px-1">·</span> {formatDate(post.createdAt)}
						</p>
					</div>
				</div>
				<Button 
					type="button" 
					variant="ghost" 
					aria-label={`More options for ${post.author.username}`} 
					className="px-2 py-0 text-lg leading-none text-muted">...
				</Button>
			</div>
			<div className="mt-5">
				<h2 className="font-serif text-xl text-text-strong">{post.title}</h2>
				<p className="mt-2 whitespace-pre-line text-sm leading-7 text-text">{post.content}</p>
			</div>
			{post.images.length > 0 && (
				<div className={`mt-5 grid gap-2 ${post.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
					{post.images.slice(0, 4).map((image) => (
						<img 
							key={image.id} 
							src={imageUrl(image.url)} 
							alt={`Dish shared by ${post.author.username}`} 
							className="aspect-[4/3] w-full rounded object-cover" 
						/>
					))}
				</div>
			)}
			<div className="mt-5 flex items-center gap-5 border-t border-border pt-4 text-xs text-muted">
				<Button 
					type="button" 
					variant="ghost" 
					aria-pressed={liked} 
					onClick={() => setLiked((value) => !value)} 
					className={`px-0 py-0 text-xs ${liked ? "text-primary-soft" : "text-muted"}`}
				>
					{liked ? "♥" : "♡"} {liked ? 1 : 0}
				</Button>
				<Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted">□ 0</Button>
				<Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted">↗ Share</Button>
			</div>
		</article>
	);
}

function DashboardContent() {
	const { user, logout, refreshUser } = useAuth();
  	const navigate = useNavigate();
	const { sendMessage, messages, status } = useWebSocket();

	// Estados para el flujo de activación del 2FA
	const [show2FaModal, setShow2FaModal] = useState<boolean>(false); //hace que se vea el QR, clave y code de 6
	const [qrCodeImage, setQrCodeImage] = useState<string | null>(null); //Guarda el string en Base64 de la imagen QR
	const [secret, setSecret] = useState<string | null>(null); //clave alfanumérica que corresponde a imagen QR
	const [twoFactorCode, setTwoFactorCode] = useState<string>(""); //guarda los 6 digitos
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [isSuccess, setIsSuccess] = useState<boolean>(false); //se pone true cuando se confirma la activación
	const [loading2Fa, setLoading2Fa] = useState<boolean>(false); //Bloquea el boton para q usuario no haga multiples clics seguidos

	// Estados para la desactivacion del 2FA
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
	const username = user?.username ?? "user";
	const navigation = [
		{ label: "Home", icon: "⌂", active: true },
		{ label: "Discover", icon: "◌", active: false },
		{ label: "Messages", icon: "□", active: false },
		{ label: "Notifications", icon: "☆", active: false },
	];

  	const handleLogout = async () => {
		console.log("--> CLICK EN LOGOUT EJECUTADO");
    	await logout();
	};

	const handleRejoindreSalon = () => {
    	// Ton sendMessage convertit déjà les objets en JSON, c'est parfait !
    	sendMessage({ event: 'joinRoom', roomName: 'general' }); 
  	};

	useEffect(() => {
		let cancelled = false;
		void axios
			.get<FeedResponse>(`${API_BASE_URL}/api/social/feed?limit=8`, { 
				validateStatus: (status) => status < 500 
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
			})
			.catch(() => { 
				if (!cancelled) { 
					setPosts(placeholderPosts); 
					setUsingPlaceholder(true); 
					setHasMore(false); 
					setError("The live feed is unavailable right now."); 
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
					.get<FeedResponse>(`${API_BASE_URL}/api/social/feed?limit=8&cursor=${encodeURIComponent(cursor)}`)
					.then(({ data }) => { 
						setPosts((current) => [...current, ...data.items]); 
						setCursor(data.nextCursor); 
						setHasMore(data.hasMore); 
					})
					.catch(() => setError("More posts could not be loaded."))
					.finally(() => setLoadingMore(false));
			}, 
			{ rootMargin: "320px" }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [cursor, hasMore, loading, loadingMore, usingPlaceholder]);

	useEffect(() => {
		console.log("Messages reçus:", messages);
	}, [messages]);

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
	const handleConfirm2FA = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage("");

		if (twoFactorCode.length !== 6) {
			setErrorMessage("Introduce el código de 6 dígitos.");
			return;
		}

		setLoading2Fa(true); // Bloqueamos botón mientras se valida

		try {
			await axios.post(`${API_BASE_URL}/api/auth/2fa/turn-on`, {
				code: twoFactorCode,
			});

			setIsSuccess(true);
			await refreshUser(); //Actualiza user.isTwoFactorEnabled en AuthContext

			setTimeout(() => {
				setShow2FaModal(false);
				setIsSuccess(false);
				setTwoFactorCode("");
			}, 2000);
		} catch (err: any) {
			console.error("Error al activar 2FA:", err);
			setErrorMessage("Código incorrecto. Vuelve a intentarlo.");
		} finally {
			setLoading2Fa(false); //Desbloqueamos tanto si acierta como si falla
		}
	};

	// Paso 3: Para desactivar 2FA, enviar a NestJS el codigo de 6 digitos
    const handleDisable2FA = async (e: React.FormEvent) => {
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

            setIsSuccess(true); //mostramos mensake
            await refreshUser(); // Actualiza isTwoFactorEnabled en AuthContext a false
			// <-- Esperamos 2 segundos antes de cerrar el modal
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
		<main className="min-h-screen bg-background font-sans text-text">
			<header className="flex h-18 items-center justify-between border-b border-border bg-surface px-5 sm:px-8">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-serif text-xl text-background">t

					</div>
					<span className="font-serif text-xl tracking-[-0.03em]">transcendence</span>
				</div>
				<div className="flex items-center gap-4">
					<Button
						type="button"
						variant="ghost"
						onClick={() => navigate("/profile")}
						className="sm:inline justify-center border-t border-border text-muted hover:text-primary-soft"
					>
						Profile
					</Button>
					<span className="hidden text-sm text-muted sm:inline">{user?.email ?? "signed in"}</span>
					<div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary bg-surface-raised text-xs font-bold text-primary-soft">
						{username.slice(0, 2).toUpperCase()}
					</div>
				</div>
			</header>

			<div className="mx-auto flex max-w-7xl">
				<aside className="hidden w-64 shrink-0 border-r border-border px-5 py-8 md:block">
					<div className="mb-8 flex items-center gap-3 border-b border-border pb-7">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-sm font-bold text-primary-soft">{username.slice(0, 2).toUpperCase()}</div>
						<div className="min-w-0">
							<p className="truncate font-serif text-lg">{username}</p>
							<p className="truncate text-xs text-muted">@{username}</p>
						</div>
					</div>
					<nav aria-label="Main navigation" className="space-y-2">
						{navigation.map((item) => (
							<Button
								key={item.label}
								type="button"
								variant={item.active ? "primary" : "ghost"}
								className={`flex w-full !justify-start items-center gap-4 rounded px-4 py-3 text-left text-sm ${
									item.active 
									? "font-semibold" 
									: "text-muted hover:bg-surface-raised hover:text-text"
								}`}
							>
								<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-lg leading-none">
									{item.icon}
								</span>
								<span className="truncate">{item.label}</span>
							</Button>
						))}
					</nav>

					<button
						type="button"
						onClick={handleLogout}
						className="relative z-50 mt-8 w-full border-t border-border px-4 pt-6 text-left text-sm font-semibold text-red-500 hover:text-red-400 cursor-pointer"
					>
						Log out
					</button>
				</aside>
				{/*FUSIONAMOS AMBOS BLOQUES*/}
				<section className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:max-w-3xl lg:px-12">
					<div className="mb-6 flex items-end justify-between border-b border-border pb-5">
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your feed</p>
							<h1 className="mt-2 font-serif text-4xl tracking-[-0.04em]">Good to see you, {username}.</h1>
						</div>
						<Button type="button" variant="ghost" className="hidden rounded border border-border px-3 py-2 text-xs text-muted hover:border-primary hover:text-primary-soft sm:block">Latest</Button>
					</div>

					<div className="space-y-4">
						<div className="flex gap-3 rounded border border-border bg-surface p-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-primary-soft">{username.slice(0, 2).toUpperCase()}</div>
							<div className="flex-1 rounded border border-border px-4 py-3 text-sm text-muted">Share something with the community...</div>
						</div>

						{loading ? <Loader label="Loading the community" /> : posts.map((post) => <PostCard key={post.id} post={post} />)}
						{error && <p className="rounded border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary-soft">{error}</p>}
						{!loading && !usingPlaceholder && <div ref={sentinelRef} className="min-h-20">{loadingMore && <Loader label="Loading more posts" />}</div>}
					</div>

					{/* Sección de Seguridad: 2FA */}
					<div className="mt-10 border-t border-border pt-6 font-sans">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold text-text-strong">Autenticación en Dos Pasos (2FA)</h3>
								<p className="mt-1 text-sm text-muted">
									{user?.isTwoFactorEnabled 
										? "Tu cuenta está protegida con autenticación de dos factores."
										: "Protege tu cuenta exigiendo un código temporal además de la contraseña."}
								</p>
							</div>
							{user?.isTwoFactorEnabled ? (
								<div className="flex items-center gap-3">
									<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
										<span className="h-2 w-2 rounded-full bg-emerald-400"></span>
										Activado
									</div>
									<Button
										type="button"
										variant="danger"
										onClick={() => {
											setErrorMessage("");
											setDisableCode("");
											setShowDisableModal(true);
											setShow2FaModal(false);
										}}
										className="px-3 py-1.5 text-xs font-semibold"
									>
										Desactivar
									</Button>
								</div>
							) : (
								<Button
									type="button"
									disabled={loading2Fa}
									onClick={handleStart2FA}
									variant="primary"
									className="px-4 py-2 text-sm font-semibold"
								>
									{loading2Fa ? "Cargando..." : "Activar 2FA"}
								</Button>
							)}
						</div>
						{/*Modal de Activacion*/}
						{show2FaModal && (
							<div className="mt-6 rounded border border-border bg-surface p-6 shadow-inner">
								<h4 className="text-base font-semibold text-text-strong">Configura tu aplicación Authenticator</h4>
								<p className="mt-1 text-xs text-muted">
									Escanea el código QR con Google Authenticator o introduce la clave secreta manualmente.
								</p>

								{errorMessage && (
									<div className="mt-3 rounded border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-200">
										{errorMessage}
									</div>
								)}

								{isSuccess ? (
									<div className="mt-4 rounded border border-green-500/30 bg-green-950/40 p-4 text-center text-sm font-semibold text-green-300">
										¡2FA Activado correctamente!
									</div>
								) : (
									<div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
										{qrCodeImage && (
											<div className="rounded bg-white p-2">
												<img src={qrCodeImage} alt="Código QR 2FA" className="h-40 w-40" />
											</div>
										)}

										<div className="flex-1 space-y-3">
											<div>
												<span className="text-xs uppercase text-muted">Clave de respaldo:</span>
												<p className="select-all font-mono text-xs text-primary-soft">{secret}</p>
											</div>

											<form onSubmit={handleConfirm2FA} className="space-y-3">
												<div>
													<label className="block text-xs uppercase text-muted">
														Código de 6 dígitos:
													</label>
													<input
														type="text"
														inputMode="numeric"
														maxLength={6}
														placeholder="123456"
														value={twoFactorCode}
														onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
														className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest text-text-strong focus:border-primary focus:outline-none"
													/>
												</div>

												<div className="flex gap-2">
													<Button
														type="submit"
														variant="primary"
														className="flex-1 py-2 text-sm font-semibold"
													>
													Confirmar y Activar
													</Button>
													<Button
														type="button"
														variant="ghost"
														onClick={() => setShow2FaModal(false)}
														className="border border-border px-3 py-2 text-sm text-muted"
													>
														Cancelar
													</Button>
												</div>
											</form>
										</div>
									</div>
								)}
							</div>
						)}

						{/*Modal de Desactivacion 2FA*/}
                		{showDisableModal && (
                    		<div className="mt-6 rounded border border-border bg-surface p-6 shadow-inner">
                        		<h4 className="text-base font-semibold text-text-strong">
                           			Desactivar Autenticación en Dos Pasos
                        		</h4>
                        		<p className="mt-1 text-xs text-muted">
                            		Por motivos de seguridad, introduce el código actual de 6 dígitos de tu app para confirmar la desactivación.
                        		</p>

                        		{errorMessage && (
                            		<div className="mt-3 rounded border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-200">
                                		{errorMessage}
                            		</div>
                        		)}
								{isSuccess ? (
									<div className="mt-4 rounded border border-green-500/30 bg-green-950/40 p-4 text-center text-sm font-semibold text-green-300">
										¡2FA Desactivado correctamente!
									</div>
								) : (

                        			<form onSubmit={handleDisable2FA} className="mt-4 max-w-sm space-y-3">
                            			<div>
                                			<label className="block text-xs uppercase text-muted">
                                    			Código de 6 dígitos:
                                			</label>
                                			<input
												type="text"
												inputMode="numeric"
												maxLength={6}
												placeholder="123456"
												autoFocus
												value={disableCode}
												onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
												className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest text-text-strong focus:border-primary focus:outline-none"
                                			/>
                            			</div>

                            			<div className="flex gap-2">
											<Button
												type="submit"
												variant="danger"
												className="flex-1 py-2 text-sm font-semibold"
											>
                                    				Confirmar y Desactivar
                                			</Button>
                                			<Button
												type="button"
												variant="ghost"
												onClick={() => setShowDisableModal(false)}
												className="border border-border px-3 py-2 text-sm text-muted"
                                			>
                                    			Cancelar
                                			</Button>
                            			</div>
                        			</form>
               					)}
							</div>
						)}
					</div>						
				</section>

				<aside className="hidden w-72 shrink-0 border-l border-border px-6 py-8 xl:block">
					<Card tag="Community pulse" title="Learn together." className="max-w-none rounded-none border-0 border-b border-border bg-transparent p-0 pb-6 shadow-none">
						<p className="mt-2 text-sm leading-relaxed text-muted">Share your favourite dishes and drool over the others</p>
					</Card>
					<Card tag="Trending today" title="What's moving" className="mt-6 max-w-none rounded-none border-0 bg-transparent p-0 shadow-none">
						<div className="mt-4 space-y-5">
							<div><p className="text-xs text-muted">01 / competition</p><p className="mt-1 text-sm font-semibold">Opening round energy</p></div>
							<div><p className="text-xs text-muted">02 / community</p><p className="mt-1 text-sm font-semibold">Find your cooking partner</p></div>
							<div><p className="text-xs text-muted">03 / practice</p><p className="mt-1 text-sm font-semibold">Learn these recipes</p></div>
						</div>
					</Card>
				</aside>
			</div>
		</main>
	);
}

export default function Dashboard() {
	return (
		<ProtectedRoute>
			<DashboardContent />
		</ProtectedRoute>
	);
}
