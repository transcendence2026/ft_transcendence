import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from 'react-router-dom';
import AppLayout, { SidebarAccount } from "../components/AppLayout";
import { Badge } from "../components/Badge";
import { Loader } from '../components/Loader';
import { useAuth } from "@/context/AuthContext";
import { CUISINE_LABELS } from "../api/explore";

interface Dish {
	id: string;
	name: string;
	description: string | null;
	price: number;
	tags: { id: string; name: string }[];
	avgRating: number | null;
	reviewCount: number;
}

interface RecentReview {
	id: string;
	rating: number;
	comment: string | null;
	createdAt: string;
	dishName: string;
	author: { id: string; username: string };
}

interface Restaurant {
	id:string;
	name: string;
	cuisine: string;
	priceRange: number;
	avgRating: number | null;
	reviewCount: number;
	dishes: Dish[];
	recentReviews: RecentReview[];
}

type State =
	| { status: 'loading' }
	| { status: 'error'; message: string }
	| { status: 'notFound' }
	| { status: 'ok'; data: Restaurant };

export default function RestaurantDetail() {
	const { id } = useParams<{ id: string }>();
	const { token, logout } = useAuth();
	const [state, setState] = useState<State>({ status: 'loading' });
	const [isFavorite, setIsFavorite] = useState(false);
	const [favoriteLoading, setFavoriteLoading] = useState(false);
	const [reviewDishId, setReviewDishId] = useState('');
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState('');
	const [reviewSubmitting, setReviewSubmitting] = useState(false);
	const [reviewError, setReviewError] = useState<string | null>(null);
	const [reviewVersion, setReviewVersion] = useState(0);

	useEffect(() => {
		// Cancel the request if the user navigates away or the id changes
		const controller = new AbortController();
		setState({ status: 'loading' });

		fetch(`/api/restaurants/${id}`, {
			headers: { Authorization: `Bearer ${token}` },
			signal: controller.signal,
		})
			.then(async (res) => {
				if (res.status === 404 || res.status === 400) {
					setState({ status: 'notFound' });
					return;
				}
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				setState({ status: 'ok', data: await res.json() });
			})
			.catch((err) => {
				if (err.name === 'AbortError') return;
				setState({ status: 'error', message: err.message });
			});
		return () => controller.abort();
	}, [id, token, reviewVersion]);

		useEffect(() => {
		if (!id || !token) return;

		const controller = new AbortController();

		fetch(`/api/restaurants/${id}/favorite`, {
			headers: { Authorization: `Bearer ${token}` },
			signal: controller.signal,
		})
		.then(async (res) => {
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			setIsFavorite(data.favorite);
		})
		.catch((err) => {
			if (err.name !== 'AbortError') {
				console.error('Could not load favorite status', err);
			}
		});

		return () => controller.abort();
	}, [id, token]);

	async function toggleFavorite() {
		if (!id || !token || favoriteLoading) return;

		setFavoriteLoading(true);

		try {
			const response = await fetch(`/api/restaurants/${id}/favorite`, {
				method: isFavorite ? 'DELETE' : 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			setIsFavorite(data.favorite);
		} catch (error) {
			console.error('Could not update favorite status', error);
		} finally {
			setFavoriteLoading(false);
		}
	}

	async function submitReview(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!reviewDishId || !token) return;

		setReviewSubmitting(true);
		setReviewError(null);

		try {
			const response = await fetch('/api/reviews', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					dishId: reviewDishId,
					rating: reviewRating,
					comment: reviewComment.trim() || undefined,
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.message ?? `HTTP ${response.status}`);
			}

			setReviewDishId('');
			setReviewRating(5);
			setReviewComment('');
			setReviewVersion((current) => current + 1);
		} catch (error) {
			setReviewError(
				error instanceof Error ? error.message : 'Could not submit review',
			);
		} finally {
			setReviewSubmitting(false);
		}
	}

	return (
		<AppLayout sidebarFooter={<SidebarAccount onLogout={() => void logout()} />}>
			<main className="flex-1 bg-[#0f0e0d] p-6">
				<div className="mx-auto flex max-w-4xl flex-col gap-6">
					<Link
						to="/discover"
						className="text-xs text-[#a88a83] hover:text-[#fabc4d] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#fabc4d]"
					>
						← Volver a explorar
					</Link>

					{state.status === 'loading' && <Loader label="Cargando restaurante..." />}

					{state.status === 'notFound' && (
						<p role="alert" className="border border-white/5 bg-[#1d1b1a] p-6 text-center text-sm text-[#a88a83]">
							Este restaurante no existe.
						</p>
					)}

					{state.status === 'error' && (
						<p role="alert" className="border border-[#ef6540]/30 bg-[#ef6540]/15 px-4 py-3 text-sm text-[#ffb4a1]">
							No se pudo cargar el restaurante ({state.message}).
						</p>
					)}

					{state.status === 'ok' && (
						<Content
							r={state.data}
							isFavorite={isFavorite}
							favoriteLoading={favoriteLoading}
							onToggleFavorite={() => void toggleFavorite()}
							reviewDishId={reviewDishId}
							reviewRating={reviewRating}
							reviewComment={reviewComment}
							reviewSubmitting={reviewSubmitting}
							reviewError={reviewError}
							onReviewDishChange={setReviewDishId}
							onReviewRatingChange={setReviewRating}
							onReviewCommentChange={setReviewComment}
							onSubmitReview={submitReview}
						/>
					)}
				</div>
			</main>
		</AppLayout>
	);
}

function Content({ 
	r,
	isFavorite,
	favoriteLoading,
	onToggleFavorite,
	reviewDishId,
	reviewRating,
	reviewComment,
	reviewSubmitting,
	reviewError,
	onReviewDishChange,
	onReviewRatingChange,
	onReviewCommentChange,
	onSubmitReview,
 }: { 
	r: Restaurant;
	isFavorite: boolean;
	favoriteLoading: boolean;
	onToggleFavorite: () => void;
	reviewDishId: string;
	reviewRating: number;
	reviewComment: string;
	reviewSubmitting: boolean;
	reviewError: string | null;
	onReviewDishChange: (value: string) => void;
	onReviewRatingChange: (value: number) => void;
	onReviewCommentChange: (value: string) => void;
	onSubmitReview: (event: FormEvent<HTMLFormElement>) => void;
}) {
	const [selectedTag, setSelectedTag] = useState<string | null>(null);

	const visibleDishes = selectedTag
		? r.dishes.filter((dish) =>
				dish.tags.some((tag) => tag.name === selectedTag),
			)
		: r.dishes;

	return (
		<article className="flex flex-col gap-6">
			<header className="border-b border-white/5 pb-5">
				<p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
					{CUISINE_LABELS[r.cuisine] ?? r.cuisine}
				</p>
				<h1 className="mt-1 text-[28px] tracking-[-0.5px] text-[#e6e1df]">{r.name}</h1>
				<button
					type="button"
					onClick={onToggleFavorite}
					disabled={favoriteLoading}
					aria-pressed={isFavorite}
					className="mt-4 inline-flex items-center gap-2 border border-[#fabc4d]/40 px-4 py-2 text-sm text-[#fabc4d] hover:bg-[#fabc4d]/10 disabled:opacity-50"
				>
					{isFavorite ? '★ Remove from favorites' : '☆ Añadir a favoritos'}
				</button>
				<p className="mt-2 text-sm text-[#a88a83]">
					<span className="text-[#fabc4d]">{'€'.repeat(r.priceRange)}</span> ·{' '}
					{r.avgRating !== null
						? `★ ${r.avgRating.toFixed(1)} (${r.reviewCount} ${r.reviewCount === 1 ? 'reseña' : 'reseñas'})`
						: 'Sin reseñas todavía'}
				</p>
			</header>

			<section aria-labelledby="dishes-title" className="border border-white/5 bg-[#211f1e] p-5">
				<h2 id="dishes-title" className="text-[20px] text-[#e6e1df]">Platos</h2>
				{r.dishes.length === 0 ? (
					<p className="mt-3 text-sm text-[#a88a83]">Este restaurante aún no tiene platos.</p>
				) : (
					<>
						{selectedTag && (
							<button
								type="button"
								onClick={() => setSelectedTag(null)}
								className="mt-3 text-xs text-[#fabc4d] hover:underline"
							>
								Ver todos los platos
							</button>
						)}
						<ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
							{visibleDishes.map((d) => (
								<li key={d.id} className="border border-white/5 bg-[#1d1b1a] p-4">
									<div className="flex items-start justify-between gap-2">
										<h3 className="text-base text-[#e6e1df]">{d.name}</h3>
										<span className="shrink-0 text-sm text-[#e6e1df]">{d.price.toFixed(2)} €</span>
									</div>
									{d.description && <p className="mt-1 text-xs text-[#a88a83]">{d.description}</p>}
									<div className="mt-3 flex flex-wrap items-center gap-1.5">
										{d.tags.map((t) => (
											<button
												key={t.id}
												type="button"
												onClick={() =>
													setSelectedTag((current) =>
														current === t.name ? null : t.name,
													)
												}
												aria-pressed={selectedTag === t.name}
												className="focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#fabc4d]"
											>
												<Badge tone={selectedTag === t.name ? 'accent' : 'muted'}>
													{t.name}
												</Badge>
											</button>
										))}
										<span className="ml-auto text-xs text-[#fabc4d]">
											{d.avgRating !== null ? `★ ${d.avgRating.toFixed(1)} (${d.reviewCount})` : 'Sin reseñas'}
										</span>
									</div>
								</li>
							))}
						</ul>
					</>
				)}
			</section>

			<section className="border border-white/5 bg-[#211f1e] p-5">
				<h2 className="text-[20px] text-[#e6e1df]">Escribe una reseña</h2>

				<form onSubmit={onSubmitReview} className="mt-4 flex flex-col gap-4">
					<label className="flex flex-col gap-1 text-sm text-[#a88a83]">
						Plato
						<select
							value={reviewDishId}
							onChange={(event) => onReviewDishChange(event.target.value)}
							required
							className="border border-white/10 bg-[#1d1b1a] px-3 py-2 text-[#e6e1df]"
						>
							<option value="">Selecciona un plato</option>
								{r.dishes.map((dish) => (
									<option key={dish.id} value={dish.id}>
										{dish.name}
									</option>
								))}
						</select>
					</label>

					<label className="flex flex-col gap-1 text-sm text-[#a88a83]">
						Clasificación
						<select
							value={reviewRating}
							onChange={(event) => onReviewRatingChange(Number(event.target.value))}
							className="border border-white/10 bg-[#1d1b1a] px-3 py-2 text-[#e6e1df]"
						>
							{[5, 4, 3, 2, 1].map((rating) => (
								<option key={rating} value={rating}>
									{'★'.repeat(rating)} ({rating}/5)
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-1 text-sm text-[#a88a83]">
						Comentario
						<textarea
							value={reviewComment}
							onChange={(event) => onReviewCommentChange(event.target.value)}
							maxLength={2000}
							rows={4}
							placeholder="Share your thoughts about this dish"
							className="resize-y border border-white/10 bg-[#1d1b1a] px-3 py-2 text-[#e6e1df]"
						></textarea>
					</label>

					{reviewError && (
						<p role="alert" className="text-sm text-[#ffb4a1]">
							{reviewError}
						</p>
					)}

					<button
						type="submit"
						disabled={reviewSubmitting || !r.dishes.length}
						className="inline-flex w-fit border border-[#fabc4d]/40 px-4 py-2 text-sm text-[#fabc4d] hover:bg-[#fabc4d]/10 disabled:opacity-50"
					>
						{reviewSubmitting ? 'Submiting...' : 'Submit review'}
					</button>
				</form>
			</section>

			<section aria-labelledby="reviews-title" className="border border-white/5 bg-[#211f1e] p-5">
				<h2 id="reviews-title" className="text-[20px] text-[#e6e1df]">Reseñas recientes</h2>
				{r.recentReviews.length === 0 ? (
					<p className="mt-3 text-sm text-[#a88a83]">Todavía no hay reseñas.</p>
				) : (
					<ul className="mt-4 flex flex-col gap-3">
						{r.recentReviews.map((rev) => (
							<li key={rev.id} className="border border-white/5 bg-[#1d1b1a] p-4">
								<p className="text-sm">
									<Link to={`/profile/${rev.author.id}`} className="text-[#e6e1df] hover:text-[#fabc4d] hover:underline">
										{rev.author.username}
									</Link>{' '}
									<span className="text-[#a88a83]">
										sobre {rev.dishName} · <span className="text-[#fabc4d]">★ {rev.rating}</span>
									</span>
								</p>
								{rev.comment && <p className="mt-1 text-sm text-[#e6e1df]">{rev.comment}</p>}
							</li>
						))}
					</ul>
				)}
			</section>
		</article>
	);
}