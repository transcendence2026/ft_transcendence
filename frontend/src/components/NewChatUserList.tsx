import { useUserSearch } from "../hooks/useUserSearch";
import type { UserResult } from "../api/explore";

export function NewChatUserList({
	query,
	onSelect,
}: {
	query: string;
	onSelect: (user: UserResult) => void;
}) {
	const { results, loading, loadingMore, error, hasMore, loadMore, retry } =
		useUserSearch(query);

	return (
		<div className="mt-3 max-h-52 overflow-y-auto">
			{loading && results.length === 0 ? (
				<p className="px-2 py-4 text-center text-[12px] text-[#a88a83]">Searching...</p>
			) : error ? (
				<div className="px-2 py-4 text-center text-[12px] text-[#a88a83]">
					<p>{error}</p>
					<button type="button" onClick={retry} className="mt-1 text-[#fabc4d] underline">
						Try again
					</button>
				</div>
			) : results.length === 0 ? (
				<p className="px-2 py-4 text-center text-[12px] leading-relaxed text-[#a88a83]">
					No users were found.
				</p>
			) : (
				<>
					{results.map((user) => (
						<button
							key={user.id}
							type="button"
							onClick={() => onSelect(user)}
							className="flex w-full items-center gap-3 border-b border-white/5 px-2 py-2.5 text-left last:border-0 hover:bg-white/[0.04]"
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#fabc4d]/25 bg-[#0f0e0d] text-[10px] font-bold text-[#fabc4d]">
								{user.username.slice(0, 2).toUpperCase()}
							</span>
							<span className="min-w-0">
								<span className="block truncate text-[13px] text-[#e6e1df]">
									@{user.username}
								</span>
								<span className="block text-[10px] tracking-[0.8px] text-[#a88a83] uppercase">
									{user.friendshipStatus === "ACCEPTED" ? "Friend" : "User"}
								</span>
							</span>
						</button>
					))}
					{hasMore && (
						<button
							type="button"
							disabled={loadingMore}
							onClick={() => void loadMore()}
							className="w-full px-2 py-2 text-center text-[11px] text-[#fabc4d] hover:underline disabled:opacity-50"
						>
							{loadingMore ? "Loading..." : "Load more"}
						</button>
					)}
				</>
			)}
		</div>
	)
}