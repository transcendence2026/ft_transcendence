import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import type { UserResult } from "../api/explore";

const FRIEND_LABELS: Record<UserResult['friendshipStatus'], string | null> = {
	NONE: null,
	PENDING_SENT: 'Solicitud enviada',
	PENDING_RECEIVED: 'Te ha enviado solicitud',
	ACCEPTED: 'Amigos',
};

export function UserCard({ user }: { user: UserResult }) {
	const { id, username, firstName, lastName, bio, isPrivate, friendshipStatus } = user;
	const fullName = [firstName, lastName].filter(Boolean).join(' ');
	const friendLabel = FRIEND_LABELS[friendshipStatus];

	return (
		<article className="relative flex items-start gap-4 border border-white/5 bg-[#1d1b1a] p-5 transition hover:border-[#fabc4d]/40">
			<div
				aria-hidden
				className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg text-[#fabc4d]"
			>
				{username[0].toUpperCase()}
			</div>
			<div className="min-w-0 flex-1">
				<h3 className="truncate text-lg text-[#e6e1df]">
					<Link
						to={`/profile/${id}`}
						className="after:absolute after:inset-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#fabc4d]"
					>
						@{username}
					</Link>
				</h3>
				{fullName && <p className="mt-1 text-xs text-[#a88a83]">{fullName}</p>}
				{bio && <p className="mt-2 line-clamp-2 text-sm text-[#a88a83]">{bio}</p>}
				<div className="mt-3 flex gap-2">
					{isPrivate && <Badge tone="muted">Perfil privado</Badge>}
					{friendLabel && <Badge tone="muted">{friendLabel}</Badge>}
				</div>
			</div>
		</article>
	);
}