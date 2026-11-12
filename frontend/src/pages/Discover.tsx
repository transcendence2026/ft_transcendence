import { useState } from 'react';
import AppLayout, { SidebarAccount } from '../components/AppLayout';
import { Button } from '../components/Button';
import { DishCarousel } from '../components/DishCarousel';
import { Input } from '../components/Input';
import { RestaurantResults } from '../components/RestaurantResults';
import { UserSearchPanel } from '../components/UserSearchPanel';
import { useAuth } from '../../context/AuthContext';
import { CUISINE, CUISINE_LABELS } from '../api/explore';

const SELECT_CLASS =
	'mt-1 w-full border border-white/10 bg-[#0f0e0d] px-3 py-2 text-sm text-[#e6e1df] outline-none focus:border-[#fabc4d]';
const LABEL_CLASS = 'block text-[10px] tracking-[1px] text-[#a88a83] uppercase';

type Tab = 'restaurants' | 'users';

const TABS: { id: Tab; label: string }[] = [
	{ id: 'restaurants', label: 'Restaurantes' },
	{ id: 'users', label: 'Usuarios' },
];

export default function Discover() {
	const { logout } = useAuth();
	const [tab, setTab] = useState<Tab>('restaurants');
	const [q, setQ] = useState('');
	const [cuisine, setCuisine] = useState('');
	const [price, setPrice] = useState('');
	const [rating, setRating] = useState('');

	const isRestaurants = tab === 'restaurants';
	// On the users tab only the text query applies
	const hasFilters = isRestaurants
		? q !== '' || cuisine !== '' || price !== '' || rating !== ''
		: q !== '';
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
							{isRestaurants ? 'Encuentra el mejor restaurante' : 'Encuentra a otros foodies'}
						</h1>
					</div>

					<DishCarousel />

					<div role="tablist" aria-label="Tipo de búsqueda" className="flex gap-6 border-b border-white/5">
						{TABS.map(({ id, label }) => (
							<button
								key={id}
								type="button"
								role="tab"
								aria-selected={tab === id}
								onClick={() => setTab(id)}
								className={`-mb-px border-b-2 pb-2 text-sm transition ${
									tab === id
										? 'border-[#fabc4d] text-[#fabc4d]'
										: 'border-transparent text-[#a88a83] hover:text-[#e6e1df]'
								}`}
							>
								{label}
							</button>
						))}
					</div>

					<section aria-label="Búsqueda y filtros" className="border border-white/5 bg-[#1d1b1a] p-5">
						<Input
							label={isRestaurants ? 'Buscar restaurantes o platos' : 'Buscar usuarios'}
							type="search"
							value={q}
							onChange={(event) => setQ(event.target.value)}
							placeholder={isRestaurants ? 'Pizza, sushi, Trattoria...' : 'Nombre de usuario o nombre...'}
						/>

						{isRestaurants && (
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
						)}

						{hasFilters && (
							<div className="mt-4">
								<Button type="button" variant="ghost" onClick={clearFilters}>
									{isRestaurants ? 'Limpiar filtros' : 'Limpiar búsqueda'}
								</Button>
							</div>
						)}
					</section>

					{isRestaurants ? (
						<RestaurantResults filters={{ q, cuisine, price, rating }} />
					) : (
						<UserSearchPanel query={q} />
					)}
				</div>
			</main>
		</AppLayout>
	);
}