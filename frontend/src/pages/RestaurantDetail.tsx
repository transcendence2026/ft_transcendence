import { useEffect, useState } from "react";
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
	}, [id, token]);

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

					{state.status === 'ok' && <Content r={state.data} />}
				</div>
			</main>
		</AppLayout>
	);
}

function Content({ r }: { r: Restaurant }) {
	return (
		<article className="flex flex-col gap-6">
			<header className="border-b border-white/5 pb-5">
				<p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
					{CUISINE_LABELS[r.cuisine] ?? r.cuisine}
				</p>
				<h1 className="mt-1 text-[28px] tracking-[-0.5px] text-[#e6e1df]">{r.name}</h1>
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
					<ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{r.dishes.map((d) => (
							<li key={d.id} className="border border-white/5 bg-[#1d1b1a] p-4">
								<div className="flex items-start justify-between gap-2">
									<h3 className="text-base text-[#e6e1df]">{d.name}</h3>
									<span className="shrink-0 text-sm text-[#e6e1df]">{d.price.toFixed(2)} €</span>
								</div>
								{d.description && <p className="mt-1 text-xs text-[#a88a83]">{d.description}</p>}
								<div className="mt-3 flex flex-wrap items-center gap-1.5">
									{d.tags.map((t) => (
										<Badge key={t.id} tone="muted">{t.name}</Badge>
									))}
									<span className="ml-auto text-xs text-[#fabc4d]">
										{d.avgRating !== null ? `★ ${d.avgRating.toFixed(1)} (${d.reviewCount})` : 'Sin reseñas'}
									</span>
								</div>
							</li>
						))}
					</ul>
				)}
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