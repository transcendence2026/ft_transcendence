import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Tabs } from '../components/Tabs';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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
  profile: { avatarUrl?: string | null; bio?: string | null } | null;
  favoriteDishes: Dish[];
  stats: { recipesRated: number; averageRecipeRating: number; favoriteIngredients: string[] };
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profileId) return;

    const endpoint = isOwnProfile
      ? `${API_BASE_URL}/api/users/me`
      : `${API_BASE_URL}/api/users/${profileId}`;

    void axios.get<ProfileData>(endpoint).then(({ data }) => {
      setProfile(data);
      setForm({ username: data.username, email: data.email, bio: data.profile?.bio ?? '' });
    }).catch(() => setError('We could not load this profile.'));
  }, [profileId, isOwnProfile, websocketStatus]);

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
      const response = await axios.post<{ profile?: ProfileData['profile'] }>(`${API_BASE_URL}/api/users/avatar`, data);
      setProfile((current) => current ? { ...current, profile: response.data.profile ?? current.profile } : current);
      setAvatarPreview(null);
      setMessage('Avatar updated.');
      setError(null);
    } catch {
      setError('Avatar could not be uploaded.');
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
                <div className="mb-2 flex flex-wrap items-center gap-2"><Badge tone={profile.status === 'ONLINE' ? 'success' : 'muted'}>{profile.status.toLowerCase()}</Badge><Badge>{profile.stats.recipesRated} recipes rated</Badge></div>
                <h1 className="font-serif text-4xl tracking-[-0.04em]">{profile.username}</h1>
                <p className="mt-1 text-sm text-muted">Member since {memberSince}</p>
              </div>
            </div>
            {isOwnProfile && <Button type="button" onClick={() => setIsEditing((current) => !current)}>{isEditing ? 'Close editor' : 'Edit profile'}</Button>}
          </div>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-text-soft">{profile.profile?.bio || 'No bio yet. Tell the community what you are cooking.'}</p>
        </section>

        {isEditing && <section className="my-8 max-w-2xl border-b border-border pb-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <Input label="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <label className="mt-5 block text-xs font-medium text-text-soft">Bio
            <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={4} className="mt-1.5 w-full resize-y rounded-control border border-border bg-surface-raised px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none" />
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void saveProfile()}>Save changes</Button>
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Change avatar</Button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setAvatarPreview(URL.createObjectURL(file)); void uploadAvatar(file); } }} />
          </div>
        </section>}

        {message && <p className="mt-5 text-sm text-emerald-300" role="status">{message}</p>}
        {error && <p className="mt-5 text-sm text-red-300" role="alert">{error}</p>}
        <section className="mt-8">
          <Tabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'favorites', label: 'Favorite dishes' }]} activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === 'overview' ? <div className="mt-8 grid gap-6 md:grid-cols-3"><div className="border-l-2 border-primary px-5"><p className="text-sm text-muted">Recipes rated</p><p className="mt-2 font-serif text-3xl text-text">{profile.stats.recipesRated}</p></div><div className="border-l-2 border-primary px-5"><p className="text-sm text-muted">Average recipe rating</p><p className="mt-2 font-serif text-3xl text-text">{profile.stats.averageRecipeRating || '--'}<span className="ml-1 text-base text-muted">/ 5</span></p></div><div className="border-l-2 border-primary px-5"><p className="text-sm text-muted">Favourite ingredients</p><div className="mt-2 flex flex-wrap gap-2">{profile.stats.favoriteIngredients.length ? profile.stats.favoriteIngredients.map((ingredient) => <Badge key={ingredient} tone="accent">{ingredient}</Badge>) : <span className="font-serif text-lg text-text">Not rated yet</span>}</div></div></div> : <div className="mt-8 grid gap-4 md:grid-cols-3">{profile.favoriteDishes.length ? profile.favoriteDishes.map((dish) => <article key={dish.id} className="border border-border bg-surface p-5"><Badge tone="accent">{dish.cuisine}</Badge><h2 className="mt-4 font-serif text-xl">{dish.name}</h2><p className="mt-1 text-sm text-muted">{dish.restaurant}</p><p className="mt-4 text-sm text-secondary">{'*'.repeat(dish.rating)}<span className="text-border">{'*'.repeat(5 - dish.rating)}</span></p></article>) : <p className="text-muted">Favorite dishes will appear after you review a dish.</p>}</div>}
        </section>
      </div>
    </main>
  );
}

export default function Profile() {
  return <ProtectedRoute><ProfileContent /></ProtectedRoute>;
}