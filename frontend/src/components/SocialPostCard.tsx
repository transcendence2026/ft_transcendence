import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

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

interface SocialPostCardProps {
  post: SocialPost;
  onPostUpdated?: (post: SocialPost) => void;
  onPostDeleted?: (postId: string) => void;
}

export function SocialPostCard({ post, onPostUpdated, onPostDeleted }: SocialPostCardProps) {
  const [liked, setLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPlaceholder = post.id.startsWith('placeholder-');
  const isAuthor = Boolean(user?.id && user.id === post.author.id);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: liked ? 'DELETE' : 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to update like status');
      setLiked(!liked);
    } catch (error) {
      console.error(error);
    }
  };

  const startEditing = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setActionError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setActionError(null);
    setIsEditing(false);
  };

  const savePost = async () => {
    const title = editTitle.trim();
    const content = editContent.trim();
    if (!title || !content) {
      setActionError('The title and content cannot be empty.');
      return;
    }

    setIsSaving(true);
    setActionError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to update the post');
      }
      const updated = await response.json();
      onPostUpdated?.({
        ...post,
        ...updated,
        title,
        content,
      });
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update the post');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePost = async () => {
    setIsDeleting(true);
    setActionError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to delete the post');
      }
      onPostDeleted?.(post.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete the post');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="feed-post rounded border border-border bg-surface p-5">
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
        {isAuthor && !isPlaceholder && (
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="ghost" onClick={startEditing} className="px-2 py-1 text-xs text-muted hover:text-primary-soft">Edit</Button>
            <Button type="button" variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="px-2 py-1 text-xs text-muted hover:text-red-400">Delete</Button>
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="post-copy mt-5 space-y-3">
          <input
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            maxLength={200}
            aria-label="Post title"
            className="w-full rounded border border-border bg-surface-raised px-3 py-2 text-sm font-semibold text-text-strong focus:border-primary focus:outline-none"
          />
          <textarea
            value={editContent}
            onChange={(event) => setEditContent(event.target.value)}
            maxLength={10000}
            rows={4}
            aria-label="Post content"
            className="w-full resize-y rounded border border-border bg-surface-raised px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
          {actionError && <p role="alert" className="text-xs text-red-400">{actionError}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={() => void savePost()} disabled={isSaving} className="px-3 py-1.5 text-xs">{isSaving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isSaving} className="border border-border px-3 py-1.5 text-xs text-muted">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="post-copy mt-5"><h2 className="font-serif text-xl text-text-strong">{post.title}</h2><p className="mt-2 whitespace-pre-line text-sm leading-7 text-text">{post.content}</p></div>
      )}
      {showDeleteConfirm && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-red-500/30 bg-red-500/5 px-3 py-2">
          <p className="text-xs text-text">Delete this post permanently?</p>
          <div className="flex gap-2">
            <Button type="button" variant="danger" onClick={() => void deletePost()} disabled={isDeleting} className="px-3 py-1.5 text-xs">{isDeleting ? 'Deleting...' : 'Delete'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowDeleteConfirm(false); setActionError(null); }} disabled={isDeleting} className="border border-border px-3 py-1.5 text-xs text-muted">Cancel</Button>
          </div>
        </div>
      )}
      {!isEditing && actionError && <p role="alert" className="mt-3 text-xs text-red-400">{actionError}</p>}
      {post.images.length > 0 && <div className={`post-gallery mt-5 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{post.images.slice(0, 4).map((image) => <img key={image.id} src={imageUrl(image.url)} alt={`Dish shared by ${post.author.username}`} className="aspect-[4/3] w-full rounded object-cover" />)}</div>}
      <div className="post-actions mt-5 flex items-center gap-5 border-t border-border pt-4 text-xs text-muted">
        <Button type="button" variant="ghost" aria-pressed={liked} onClick={handleLike} className={`px-0 py-0 text-xs ${liked ? 'text-primary-soft' : 'text-muted'}`}>
          {liked ? '♥' : '♡'} {liked ? 1 : 0}
        </Button>
        <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted">□ 0</Button>
        <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted">↗ Share</Button>
      </div>
    </article>
  );
}
