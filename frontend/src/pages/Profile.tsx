import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Tabs } from '../components/Tabs';
import { Loader } from '../components/Loader';
import { SocialPostCard, type SocialPost } from '../components/SocialPostCard';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { ImageDropzone } from '../components/ImageDropzone';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface Dish {
  id: string;
  name: string;
  restaurant: string;
  cuisine: string;
  rating: number;
}

interface ProfileData {
  id: string;
  username: string;
  email: string;
  status: 'ONLINE' | 'OFFLINE' | 'INGAME';
  createdAt: string;
  isPrivate?: boolean;
  message?: string | null;
  profile: { avatarUrl?: string | null; bio?: string | null } | null;
  favoriteDishes: Dish[];
  stats: { recipesRated: number; averageRecipeRating: number; favoriteIngredients: string[] | null; } | null;
  friendship: { status: 'SELF' | 'NONE' | 'OUTGOING_PENDING' | 'INCOMING_PENDING' | 'ACCEPTED' | 'DECLINED'; requestId: string | null };
}

interface BlockedUserItem {
  blockId: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface FriendRequest {
  id: string;
  sender: { id: string; username: string; profile?: { avatarUrl: string | null } | null };
}

interface FriendSummary {
  id: string;
  username: string;
  profile?: { avatarUrl: string | null } | null;
}

interface FriendListResponse {
  friends: FriendSummary[];
  incomingRequests: FriendRequest[];
  outgoingRequests: { id: string; receiver: FriendSummary }[];
}

interface SocialPostsResponse {
  items: SocialPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

function profileImage(url?: string | null) {
  if (!url || url === 'default-avatar.png') return null;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}

function ProfileContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { status: websocketStatus } = useWebSocket();
  const navigate = useNavigate();
  const isOwnProfile = !id || id === user?.id;
  const profileId = id ?? user?.id;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', bio: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [friendship, setFriendship] = useState<ProfileData['friendship'] | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendListResponse['outgoingRequests']>([]);
  const [profilePosts, setProfilePosts] = useState<SocialPost[]>([]);
  const [profilePostsCursor, setProfilePostsCursor] = useState<string | null>(null);
  const [profilePostsHasMore, setProfilePostsHasMore] = useState(true);
  const [profilePostsLoading, setProfilePostsLoading] = useState(false);
  const profilePostsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarDropzoneVisible, setIsAvatarDropzoneVisible] = useState(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);

  useEffect(() => {
    if (!profileId) return;

    const endpoint = isOwnProfile
      ? `${API_BASE_URL}/api/users/me`
      : `${API_BASE_URL}/api/users/${profileId}`;

    void axios.get<ProfileData>(endpoint).then(async ({ data }) => {
      setProfile(data);
	  setIsPrivate(Boolean(data.isPrivate));
      setFriendship(data.friendship);
      setForm({ username: data.username, email: data.email, bio: data.profile?.bio ?? '' });
      if (isOwnProfile) {
        const friendsResponse = await axios.get<FriendListResponse>(`${API_BASE_URL}/api/friends`);
        setFriends(friendsResponse.data.friends);
        setIncomingRequests(friendsResponse.data.incomingRequests);
        setOutgoingRequests(friendsResponse.data.outgoingRequests);
		//carga lista de bloqueados
		try {
          const blockedRes = await axios.get<BlockedUserItem[]>(`${API_BASE_URL}/api/users/blocked`);
          setBlockedUsers(blockedRes.data);
        } catch {
			// Ignorar si falla la carga inicial de bloqueos
		}
      }
    }).catch(() => setError('We could not load this profile.'));
  }, [profileId, isOwnProfile, websocketStatus]);

  // Si es un perfil privado bloqueado, no intentamos pedir posts
  const isLockedPrivateProfile = !isOwnProfile && profile?.isPrivate && !profile?.stats;

  useEffect(() => {
    if (activeTab !== 'posts' || !profileId || isLockedPrivateProfile) return;
    setProfilePostsLoading(true);
    void axios.get<SocialPostsResponse>(`${API_BASE_URL}/api/social/feed?authorId=${profileId}&limit=8`)
      .then(({ data }) => { setProfilePosts(data.items); setProfilePostsCursor(data.nextCursor); setProfilePostsHasMore(data.hasMore); })
      .catch(() => setError('We could not load this user\'s posts.'))
      .finally(() => setProfilePostsLoading(false));
  }, [activeTab, profileId, websocketStatus, isLockedPrivateProfile]);

  useEffect(() => {
    const sentinel = profilePostsEndRef.current;
    if (activeTab !== 'posts' || !sentinel || !profilePostsHasMore || !profilePostsCursor || profilePostsLoading || isLockedPrivateProfile) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || !profileId) return;
      setProfilePostsLoading(true);
      void axios.get<SocialPostsResponse>(`${API_BASE_URL}/api/social/feed?authorId=${profileId}&limit=8&cursor=${encodeURIComponent(profilePostsCursor)}`)
        .then(({ data }) => { setProfilePosts((current) => [...current, ...data.items]); setProfilePostsCursor(data.nextCursor); setProfilePostsHasMore(data.hasMore); })
        .catch(() => setError('More posts could not be loaded.'))
        .finally(() => setProfilePostsLoading(false));
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, profileId, profilePostsCursor, profilePostsHasMore, profilePostsLoading, isLockedPrivateProfile]);

  const saveProfile = async () => {
    try {
      const { data } = await axios.patch<ProfileData>(`${API_BASE_URL}/api/users/me`, form);
      setProfile(data);
      setIsEditing(false);
      setMessage('Profile updated.');
      setError(null);
    } catch (saveError) {
      setError(axios.isAxiosError(saveError)
        ? saveError.response?.data?.message ?? 'Profile could not be updated.'
        : 'Profile could not be updated.');
    }
  };

  const uploadAvatar = async (file: File) => {
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await axios.post<{ user?: { profile?: ProfileData['profile'] }; profile?: ProfileData['profile'] }>(`${API_BASE_URL}/api/users/avatar`, data);
      const updatedProfile = response.data.user?.profile ?? response.data.profile;
      setProfile((current) => current ? { ...current, profile: updatedProfile ?? current.profile } : current);
      setAvatarPreview(null);
      setMessage('Avatar updated.');
      setError(null);
    } catch {
      setError('Avatar could not be uploaded.');
    }
  };

  const sendFriendRequest = async () => {
    if (!profileId) return;
    await axios.post(`${API_BASE_URL}/api/friends/requests/${profileId}`);
    setFriendship({ status: 'OUTGOING_PENDING', requestId: null });
    setMessage('Friend request sent.');
  };

  const respondToFriendRequest = async (action: 'accept' | 'reject', requestId = friendship?.requestId) => {
    if (!requestId) return;
    await axios.patch(`${API_BASE_URL}/api/friends/requests/${requestId}/${action}`);
    navigate('/dashboard');
  };

  const cancelFriendRequest = async (requestId: string) => {
    await axios.delete(`${API_BASE_URL}/api/friends/requests/${requestId}`);
    setOutgoingRequests((current) => current.filter((request) => request.id !== requestId));
    setMessage('Friend request cancelled.');
  };

  // Alternar privacidad
  const togglePrivacy = async () => {
    try {
      const nextState = !isPrivate;
      await axios.patch(`${API_BASE_URL}/api/auth/privacy`, { isPrivate: nextState });
      setIsPrivate(nextState);
      setMessage(`Profile set to ${nextState ? 'private' : 'public'}.`);
      setError(null);
    } catch {
      setError('Could not update privacy setting.');
    }
  };

  // Bloquear usuario ajeno
  const blockUser = async () => {
    if (!profileId) return;
    if (!window.confirm(`Are you sure you want to block ${profile?.username}?`)) return;
    try {
      await axios.post(`${API_BASE_URL}/api/users/block/${profileId}`);
      setMessage(`User ${profile?.username} blocked.`);
      navigate('/dashboard'); // Redirige fuera del perfil bloqueado
    } catch {
      setError('Could not block user.');
    }
  };

  // Desbloquear usuario desde la lista
  const unblockUser = async (targetId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/block/${targetId}`);
      setBlockedUsers((current) => current.filter((item) => item.user.id !== targetId));
      setMessage('User unblocked successfully.');
    } catch {
      setError('Could not unblock user.');
    }
  };

  if (error && !profile) return <main className="min-h-screen bg-background p-8 text-text"><p>{error}</p></main>;
  if (!profile) return <main className="min-h-screen bg-background p-8 text-muted">Loading profile...</main>;

  const presence = profile.status === 'ONLINE' ? 'online' : profile.status === 'INGAME' ? 'ingame' : 'offline';
  const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen bg-background font-sans text-text">
      <header className="flex h-18 items-center justify-between border-b border-border bg-surface px-5 sm:px-8">
        <button type="button" className="flex items-center gap-3 text-left" onClick={() => navigate('/dashboard')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-serif text-xl text-background">t</span>
          <span className="font-serif text-xl tracking-[-0.03em]">transcendence</span>
        </button>
        <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>Back to feed</Button>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
        <section className="border-b border-border pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <Avatar name={profile.username} src={avatarPreview ?? profileImage(profile.profile?.avatarUrl)} presence={presence} size="xl" />
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone={profile.status === 'ONLINE' ? 'success' : 'muted'}>{profile.status.toLowerCase()}</Badge>{profile.stats &&<Badge>{profile.stats.recipesRated} recipes rated</Badge>}</div>
                <h1 className="font-serif text-4xl tracking-[-0.04em]">{profile.username}</h1>
                <p className="mt-1 text-sm text-muted">Member since {memberSince}</p>
              </div>
            </div>
            {isOwnProfile && <Button type="button" onClick={() => setIsEditing((current) => !current)}>{isEditing ? 'Close editor' : 'Edit profile'}</Button>}
            {!isOwnProfile && (friendship?.status === 'NONE' || friendship?.status === 'DECLINED') && <Button type="button" onClick={() => void sendFriendRequest()}>+ Add friend</Button>}
            {!isOwnProfile && friendship?.status === 'OUTGOING_PENDING' && <Badge tone="muted">Request sent</Badge>}
            {!isOwnProfile && friendship?.status === 'ACCEPTED' && <Badge tone="success">Friends</Badge>}
            {!isOwnProfile && friendship?.status === 'INCOMING_PENDING' && <div className="flex gap-2"><Button type="button" onClick={() => void respondToFriendRequest('accept')}>Accept</Button><Button type="button" variant="ghost" onClick={() => void respondToFriendRequest('reject')}>Reject</Button></div>}
			{!isOwnProfile && <Button type="button" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => void blockUser()}>Block user</Button>}
          </div>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-text-soft">{profile.profile?.bio || (isLockedPrivateProfile ? '' : 'No bio yet. Tell the community what you are cooking.')}</p>
        </section>

        {isEditing && <section className="my-8 max-w-2xl border-b border-border pb-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <Input label="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <label className="mt-5 block text-xs font-medium text-text-soft">Bio
            <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} className="mt-1.5 w-full resize-y rounded-control border border-border bg-surface-raised px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none" />
          </label>
		  {/* AQUÍ VA BOTON DE PERFIL PUBLICO/PRIVADO */}
		  <div className="mt-5 flex items-center justify-between rounded-control border border-border bg-surface-raised p-4">
            <div>
              <p className="text-sm font-medium text-text">Private account</p>
              <p className="text-xs text-muted">Only accepted friends will be able to see your posts and ratings.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPrivate}
              onClick={() => void togglePrivacy()}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPrivate ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  isPrivate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

            {isAvatarDropzoneVisible && (
              <div className="mt-5 max-w-md">
                <ImageDropzone
                  currentImageUrl={profileImage(profile.profile?.avatarUrl) ?? undefined}
                  onFileSelect={(file) => {
                    setAvatarPreview(URL.createObjectURL(file));
                    void uploadAvatar(file);
                  }}
                  variant="avatar"
                />
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void saveProfile()}>Save changes</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAvatarDropzoneVisible((current) => !current)}
              >
                {isAvatarDropzoneVisible ? 'Close avatar picker' : 'Change avatar'}
              </Button>
            {/* <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Change avatar</Button> */}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setAvatarPreview(URL.createObjectURL(file)); void uploadAvatar(file); } }} />
        	</div>
          </section>}

          {message && <p className="mt-5 text-sm text-emerald-300" role="status">{message}</p>}
          {error && <p className="mt-5 text-sm text-red-300" role="alert">{error}</p>}
          {isOwnProfile && <section className="mt-8 max-w-2xl space-y-8 border-y border-border py-6">
            <div>
              <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Friends</h2><Badge tone="success">{friends.length}</Badge></div>
              <div className="mt-4 space-y-3">{friends.length ? friends.map((friend) => <button key={friend.id} type="button" onClick={() => navigate(`/profile/${friend.id}`)} className="flex w-full items-center gap-3 border border-border bg-surface p-3 text-left hover:border-primary"><Avatar name={friend.username} src={profileImage(friend.profile?.avatarUrl)} size="sm" /><span className="text-sm font-semibold">{friend.username}</span></button>) : <p className="text-sm text-muted">Your accepted friends will appear here.</p>}</div>
            </div>
            <div>
              <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Friend requests</h2><Badge tone="accent">{incomingRequests.length + outgoingRequests.length} pending</Badge></div>
              <div className="mt-4 space-y-3">{incomingRequests.map((request) => <div key={request.id} className="flex items-center justify-between gap-3 border border-border bg-surface p-3"><div className="flex items-center gap-3"><Avatar name={request.sender.username} src={profileImage(request.sender.profile?.avatarUrl)} size="sm" /><span className="text-sm font-semibold">{request.sender.username}</span></div><div className="flex gap-2"><Button type="button" onClick={() => void respondToFriendRequest('accept', request.id)} className="px-3 py-1 text-xs">Accept</Button><Button type="button" variant="ghost" onClick={() => void respondToFriendRequest('reject', request.id)} className="px-3 py-1 text-xs">Reject</Button></div></div>)}{outgoingRequests.map((request) => <div key={request.id} className="flex items-center justify-between gap-3 border border-border bg-surface p-3"><div className="flex items-center gap-3"><Avatar name={request.receiver.username} src={profileImage(request.receiver.profile?.avatarUrl)} size="sm" /><span className="text-sm text-muted">Waiting for {request.receiver.username}</span></div><Button type="button" variant="ghost" onClick={() => void cancelFriendRequest(request.id)} className="px-3 py-1 text-xs text-primary-soft">Cancel</Button></div>)}{!incomingRequests.length && !outgoingRequests.length && <p className="text-sm text-muted">No pending requests.</p>}</div>
            </div>
          </section>}

		  {/* CONTENIDO DEL PERFIL: TARJETA DE PRIVACIDAD O TABS */}
          <section className="mt-8">
		    {isLockedPrivateProfile ? (
              <div className="flex flex-col items-center justify-center rounded-control border border-border bg-surface p-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-2xl border border-border">
                  🔒
				</span>
                <h2 className="mt-4 font-serif text-2xl tracking-tight">This account is private</h2>
                <p className="mt-2 max-w-md text-sm text-muted">
                  {profile.message || 'Follow or become friends with this user to see their recipe reviews, ratings, and shared posts.'}
                </p>
                {friendship?.status === 'NONE' && (
                  <div className="mt-6">
                    <Button type="button" onClick={() => void sendFriendRequest()}>
                      Send friend request
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
        	    <Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'favorites', label: 'Favorite dishes' }, { id: 'posts', label: 'Posts' }]} activeTab={activeTab} onChange={setActiveTab} />
          	    {activeTab === 'overview' && profile.stats ? (
				  <div className="mt-8 grid gap-6 md:grid-cols-3">
				    <div className="border-l-2 border-primary px-5">
					  <p className="text-sm text-muted">Recipes rated</p>
					  <p className="mt-2 font-serif text-3xl text-text">{profile.stats.recipesRated}</p>
				    </div>
				    <div className="border-l-2 border-primary px-5">
				      <p className="text-sm text-muted">Average recipe rating</p>
					  <p className="mt-2 font-serif text-3xl text-text">{profile.stats.averageRecipeRating || '--'}<span className="ml-1 text-base text-muted">/ 5</span></p>
				    </div>
				    <div className="border-l-2 border-primary px-5">
					  <p className="text-sm text-muted">Favourite ingredients</p>
				      <div className="mt-2 flex flex-wrap gap-2">
						{profile.stats.favoriteIngredients?.length ? (
						  profile.stats.favoriteIngredients.map((ingredient) => <Badge key={ingredient} tone="accent">{ingredient}</Badge>)
						) : (
						  <span className="font-serif text-lg text-text">Not rated yet</span>
					    )}
					  </div>
				    </div>
			      </div>
		      ) : activeTab === 'favorites' ? (
			    <div className="mt-8 grid gap-4 md:grid-cols-3">
				  {profile.favoriteDishes.length ?  (
				    profile.favoriteDishes.map((dish) => (
					  <article key={dish.id} className="border border-border bg-surface p-5">
						<Badge tone="accent">{dish.cuisine}</Badge>
						<h2 className="mt-4 font-serif text-xl">{dish.name}</h2>
						<p className="mt-1 text-sm text-muted">{dish.restaurant}</p>
						<p className="mt-4 text-sm text-secondary">{'*'.repeat(dish.rating)}<span className="text-border">{'*'.repeat(5 - dish.rating)}</span></p>
					  </article>
				    ))
				  ) : (
				    <p className="text-muted">Favorite dishes will appear after you review a dish.</p>
				  )}
			    </div>
		      ) : ( 
			    <div className="mt-8 space-y-4">
				  {profilePostsLoading && !profilePosts.length ? (
					<Loader label="Loading posts" />
				  ) : profilePosts.length ? (
					profilePosts.map((post) => <SocialPostCard key={post.id} post={post} />) 
				  ) : ( 
				    <p className="text-muted">No visible posts yet.</p>
				  )}
				  <div ref={profilePostsEndRef} className="min-h-16">
					{profilePostsLoading && <Loader label="Loading more posts" />}
				  </div>
			    </div>
		      )}
		    </>
	      )}
        </section>
      </div>
    </main>
  );
}

export default function Profile() {
  return <ProtectedRoute><ProfileContent /></ProtectedRoute>;
}