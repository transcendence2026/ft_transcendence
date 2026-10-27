import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Loader } from "./Loader";
import {
	CUISINE_LABELS,
	getDishRecommendations,
	type DishRecommendation,
} from "../api/explore";

export function DishCarousel() {
	const [dishes, setDishes] = useState<DishRecommendation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [attempt, setAttempt] = useState(0);
	const trackRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		const controller = new AbortController();
		setLoading(true);
		setError(false);

		getDishRecommendations(10, controller.signal)
			.then(setDishes)
			.catch((err) => {
				if (!axios.isCancel(err)) setError(true);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});

		return () => controller.abort();
	}, [attempt]);

	const scroll = (direction: 1 | -1) => {
		const track = trackRef.current;
		if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
	};

	const topRated = dishes[0]?.source === 'top-rated';

	return (
		<section aria-labelledby="recommendations-title" className="border border-white/5 bg-[#211f1e] p-5">
			<div className="flex items-end justify-between gap-4">
				<div>
					<p className="text-[10px] font-bold tracking-[2px] text-[#fabc4d] uppercase">
						{topRated ? 'LOS MÁS VALORADOS' : 'RECOMENDACIONES DE TasteSync'}
					</p>
					<h2 id="recommendations-title" className="mt-1 text-[20px] text-[#e6e1df]">
						{topRated ? 'Platos populares' : 'Lo mejor para ti'}
					</h2>
				</div>
				{dishes.length > 1 && (
					<div className="flex gap-2">
						<Button type="button" variant="ghost" aria-label="Anteriores" onClick={() => scroll(-1)}>
							<ChevronLeft aria-hidden="true" className="size-4" />
						</Button>
						<Button type="button" variant="ghost" aria-label="Siguientes" onClick={() => scroll(1)}>
							<ChevronRight aria-hidden="true" className="size-4" />
						</Button>
					</div>
				)}
			</div>

			<div className="mt-4">
				{loading ? (
					<Loader label="Preparando recomendaciones..." />
				) : error ? (
					<div className="flex items-center gap-3 text-sm text-[#ffb4a1]">
						<span>No se pudieron cargar las recomendaciones.</span>
						<Button type="button" variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
							Reintentar
						</Button>
					</div>
				) : dishes.length === 0 ? (
					<p className="text-sm text-[#a88a83]">
						Todavía no hay recomendaciones disponibles para tu perfil.
					</p>
				) : (
					// tabIndex makes the track focusable so arrow keys scroll it
					<ul
						ref={trackRef}
						tabIndex={0}
						aria-label="Lista de platos recomendados"
						className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#fabc4d]"
					>
						{dishes.map((dish) => (
							<li
								key={dish.id}
								className="w-64 shrink-0 snap-start border border-white/5 bg-[#1d1b1a] p-4"
							>
								<div className="flex items-start justify-between gap-2">
									<h3 className="text-base text-[#e6e1df]">{dish.name}</h3>
									<span className="shrink-0 text-xs text-[#fabc4d]">
										{dish.source === 'top-rated'
											? `★ ${(dish.score * 5).toFixed(1)}`
											: `${Math.round(dish.score * 100)}% afín`}
									</span>
								</div>
								<p className="mt-1 text-xs text-[#a88a83]">
									{dish.restaurant.name} ·{' '}
									{CUISINE_LABELS[dish.restaurant.cuisine] ?? dish.restaurant.cuisine}
								</p>
								<p className="mt-2 text-sm text-[#e6e1df]">{dish.price.toFixed(2)} €</p>
								<div className="mt-3 flex flex-wrap gap-1.5">
									{dish.tags.slice(0, 3).map((tag) => (
										<Badge key={tag} tone="muted">
											{tag}
										</Badge>
									))}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}