import { useState } from 'react';
import AppLayout, { SidebarAccount } from '../components/AppLayout';
import { Button } from '../components/Button';
import { DishCarousel } from '../components/DishCarousel';
import { Input } from '../components/Input';
import { Loader } from '../components/Loader';
import { RestaurantCard } from '../components/RestaurantCard';
import { useAuth } from '../../context/AuthContext';
import { CUISINE, CUISINE_LABELS } from '../api/explore';
import { useRestaurantSearch } from '../hooks/useRestaurantSearch';

const SELECT_CLASS =
	'mt-1 w-full border border-white/10 bg-[#0f0e0d] px-3 py-2 text-sm text-[#e6e1df] outline-none focus:border-[#fabc4d]';
const LABEL_CLASS = 'block text-[10px] tracking-[1px] text-[#a88a83] uppercase';

export default function Discover() {
	const { logout } = useAuth();
	const [q, setQ] = useState('');
	const [cuisine, setCuisine] = useState('');
	const [price, setPrice] = useState('');
	const [rating, setRating] = useState('');

	const { results, loading, loadingMore, error, hasMore, loadMore, retry } =
		useRestaurantSearch({ q, cuisine, price, rating });

	const hasFilters = q !== '' || cuisine !== '' || price !== '' || rating !== '';
	const clearFilters = () => {
		setQ('');
		setCuisine('');
		setPrice('');
		setRating('');
	};

	return (
		<AppLayout sidebarFooter={<SidebarAccount onLogout={() => void logout()} />}>
			<main className="flex-1 bg-[#0f0e0d] p-6">
				<div className="mx-auto flex max-w-6xl flex-col gap-6">
					<div className="border-b border-white/5 pb-5">
						<p className="text-[11px] font-bold tracking-[2.75px] text-[#fabc4d] uppercase">
							DESCUBRE
						</p>
						<h1 className="mt-1 text-[28px] tracking-[-0.5px] text-[#e6e1df]">
							Encuentra el mejor restaurante
						</h1>
					</div>

					<DishCarousel />

					<section aria-label="Búsqueda y filtros" className="border border-white/5 bg-[#1d1b1a] p-5">
						<Input
							label="Buscar restaurantes o platos"
							type="search"
							value={q}
							onChange={(event) => setQ(event.target.value)}
							placeholder="Pizza, sushi, Trattoria..."
						/>

						<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
							<label className={LABEL_CLASS}>
								Tipo de Cocina
								<select
									className={SELECT_CLASS}
									value={cuisine}
									onChange={(event) => setCuisine(event.target.value)}
								>
									<option value="">Todas</option>
									{CUISINE.map((value) => (
										<option key={value} value={value}>
											{CUISINE_LABELS[value]}
										</option>
									))}
								</select>
							</label>

							<label className={LABEL_CLASS}>
								Precio
								<select
									className={SELECT_CLASS}
									value={price}
									onChange={(event) => setPrice(event.target.value)}
								>
									<option value="">Cualquiera</option>
									<option value="1">€</option>
									<option value="2">€€</option>
									<option value="3">€€€</option>
									<option value="4">€€€€</option>
								</select>
							</label>

							<label className={LABEL_CLASS}>
								Valoración mínima
								<select
									className={SELECT_CLASS}
									value={rating}
									onChange={(event) => setRating(event.target.value)}
								>
									<option value="">Cualquiera</option>
									<option value="2">2 ★ o más</option>
									<option value="3">3 ★ o más</option>
									<option value="4">4 ★ o más</option>
									<option value="5">5 ★ </option>
								</select>
							</label>
						</div>

						{hasFilters && (
							<div className="mt-4">
								<Button type="button" variant="ghost" onClick={clearFilters}>
									Limpiar filtros
								</Button>
							</div>
						)}
					</section>

					<section aria-label="Resultados" aria-busy={loading}>
						{/* Announced to screen readers whenever the result count changes */}
						<p aria-live="polite" className="mb-3 text-xs text-[#a88a83]">
							{loading
								? 'Buscando...'
								: results.length === 0
									? 'Sin resultados'
									: `${results.length} ${results.length === 1 ? 'restaurante' : 'restaurantes'}${hasMore ? ' (hay más)' : ''}`}
						</p>

						{error && (
							<div className="mb-4 flex items-center gap-3 border border-[#ef6540]/30 bg-[#ef6540]/15 px-4 py-3 text-sm text-[#ffb4a1]">
								<span>{error}</span>
								<Button type="button" variant="secondary" onClick={retry}>
									Reintentar
								</Button>
							</div>
						)}

						{loading && results.length === 0 ? (
							<Loader label="Buscando restaurantes..." />
						) : results.length === 0 && !error ? (
							<p className="border border-white/5 bg-[#1d1b1a] p-6 text-center text-sm text-[#a88a83]">
								No hay restaurantes que coincidan con tu búsqueda.
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
									{loadingMore ? 'Cargando...' : 'Cargar más'}
								</Button>
							</div>
						)}
					</section>
				</div>
			</main>
		</AppLayout>
	);
}