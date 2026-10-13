import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface SocialPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string; profile?: { avatarUrl: string | null } | null };
  images: { id: string; url: string }[];
  friendship: { status: string; requestId: string | null };
}

function imageUrl(url: string) {
  return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatDate(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SocialPostCard({ post }: { post: SocialPost }) {
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();
  const isPlaceholder = post.id.startsWith('placeholder-');

  return (
    <article className="rounded border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Avatar name={post.author.username} src={post.author.profile?.avatarUrl ? imageUrl(post.author.profile.avatarUrl) : null} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="truncate text-left text-sm font-semibold text-text-strong hover:text-primary-soft" onClick={() => navigate(`/profile/${post.author.id}`)}>{post.author.username}</button>
              <Badge tone="muted">{isPlaceholder ? 'welcome' : post.title.split(' ')[0]}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">@{post.author.username} <span className="px-1">·</span> {formatDate(post.createdAt)}</p>
          </div>
        </div>
      </div>
      <div className="mt-5"><h2 className="font-serif text-xl text-text-strong">{post.title}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-text">{post.content}</p></div>
      {post.images.length > 0 && <div className={`mt-5 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{post.images.slice(0, 4).map((image) => <img key={image.id} src={imageUrl(image.url)} alt={`Dish shared by ${post.author.username}`} className="aspect-[4/3] w-full rounded object-cover" />)}</div>}
      <div className="mt-5 flex items-center gap-5 border-t border-border pt-4 text-xs text-muted"><Button type="button" variant="ghost" aria-pressed={liked} onClick={() => setLiked((value) => !value)} className={`px-0 py-0 text-xs ${liked ? 'text-primary-soft' : 'text-muted'}`}>{liked ? '♥' : '♡'} {liked ? 1 : 0}</Button><Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted">□ 0</Button><Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted">↗ Share</Button></div>
    </article>
  );
}
