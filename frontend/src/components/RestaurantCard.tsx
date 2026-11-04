import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import { CUISINE_LABELS, type RestaurantResult } from "../api/explore";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantResult }) {
	const { id, name, cuisine, priceRange, avgRating, reviewCount } = restaurant;

	return (
		// relative: anchors the stretched link below to this card
		<article className="relative border border-white/5 bg-[#1d1b1a] p-5transition hover:border-[#fabc4d]/40">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="truncate text-lg text-[#e6e1df]">
						{/* after:absolute after:insert-0 makes the whole card clickable */}
						<Link
							to={`/restaurants/${id}`}
							className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#fabc4d]"
						>
							{name}
						</Link>
					</h3>
					<p className="mt-1 text-xs text-[#a88a83]">{CUISINE_LABELS[cuisine] ?? cuisine}</p>
				</div>
				<span
					aria-label={`Rango de precio ${priceRange} de 4`}
					className="shrink-0 text-sm text-[#fabc4d]"
				>
					{'€'.repeat(priceRange)}
				</span>
			</div>

			<div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
				{avgRating === null ? (
					<Badge tone="muted">Sin reseñas</Badge>
				) : (
					<>
						<span className="text-sm text-[#fabc4d]">★ {avgRating.toFixed(1)}</span>
						<span className="text-xs text-[#a88a83]">
							({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
						</span>
					</>
				)}
			</div>
		</article>
	);
}