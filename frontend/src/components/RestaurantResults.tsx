import { Button } from "./Button";
import { Loader } from "./Loader";
import { RestaurantCard } from "./RestaurantCard";
import { useRestaurantSearch, type SearchFilters } from "../hooks/useRestaurantSearch";

export function RestaurantResult({ filters }: { filters: SearchFilters }) {
	const { results, loading, loadingMore, error, hasMore, loadMore, retry } = useRestaurantSearch(filters);

	return (
		<section aria-label="Results" aria-busy={loading}>
			{/* Announced to screen readers whenever the result count changes */}
			<p aria-live="polite" className="mb-3 text-xs text-[#a88a83]">
				{loading
					? 'Searching...'
					: results.length === 0
						? 'No results'
						: `${results.length} ${results.length === 1 ? 'restaurant' : 'restaurants'}${hasMore ? ' (there’s more)' : ''}`}
			</p>

			{error && (
				<div className="mb-4 flex items-center gap-3 border border-[#ef6540]/30 bg-[#ef6540]/15 px-4 py-3 text-sm text-[#ffb4a1]">
					<span>{error}</span>
					<Button type="button" variant="secondary" onClick={retry}>
						Try again
					</Button>
				</div>
			)}

			{loading && results.length === 0 ? (
				<Loader label="Looking for restaurants..." />
			) : results.length === 0 && !error ? (
				<p className="border border-white/5 bg-[#1d1b1a] p-6 text-center text-sm text-[#a88a83]">
					There are no restaurants matching your search.
				</p>
			) : (
				<div
					className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}
				>
					{results.map((restaurant) => (
						<RestaurantCard key={restaurant.id} restaurant={restaurant} />
					))}
				</div>
			)}

			{hasMore && !loading && (
				<div className="mt-6 flex justify-center">
					<Button
						type="button"
						variant="secondary"
						disabled={loadingMore}
						onClick={() => void loadMore()}
					>
						{loadingMore ? 'Loading...' : 'Load more'}
					</Button>
				</div>
			)}
		</section>
	);
}