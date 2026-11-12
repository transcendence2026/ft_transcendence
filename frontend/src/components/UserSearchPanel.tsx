import { Button } from './Button';
import { Loader } from './Loader';
import { UserCard } from './UserCard';
import { useUserSearch } from '../hooks/useUserSearch';

export function UserSearchPanel({ query }: { query: string }) {
	const { results, loading, loadingMore, error, hasMore, loadMore, retry } =
		useUserSearch(query);

	return (
		<section aria-label="Resultados" aria-busy={loading}>
			<p aria-live="polite" className="mb-3 text-xs text-[#a88a83]">
				{loading
					? 'Buscando...'
					: results.length === 0
						? 'Sin resultados'
						: `${results.length} ${results.length === 1 ? 'usuario' : 'usuarios'}${hasMore ? ' (hay más)' : ''}`}
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
				<Loader label="Buscando usuarios..." />
			) : results.length === 0 && !error ? (
				<p className="border border-white/5 bg-[#1d1b1a] p-6 text-center text-sm text-[#a88a83]">
					No hay usuarios que coincidan con tu búsqueda.
				</p>
			) : (
				<div
					className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}
				>
					{results.map((user) => (
						<UserCard key={user.id} user={user} />
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
	);
}