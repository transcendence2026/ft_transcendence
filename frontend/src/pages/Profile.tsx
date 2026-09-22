import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface AvatarUploadResponse {
	profile?: {
		avatarUrl?: string | null;
	} | null;
}

function ProfileContent() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState(user?.username ?? 'user');
	const [email, setEmail] = useState(user?.email ?? '');
	const [bio, setBio] = useState('Learning, competing, and building with the community.');
	const [showSaveModal, setShowSaveModal] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarError, setAvatarError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		return () => {
			if (avatarPreview) URL.revokeObjectURL(avatarPreview);
		};
	}, [avatarPreview]);

	const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		setAvatarError(null);

		if (!file) return;
		if (!['image/jpeg', 'image/png'].includes(file.type)) {
			setAvatarFile(null);
			setAvatarPreview(null);
			setAvatarError('Choose a JPG or PNG image.');
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			setAvatarFile(null);
			setAvatarPreview(null);
			setAvatarError('The image must be smaller than 2 MB.');
			return;
		}

		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file));
	};

	const uploadAvatar = async () => {
		if (!avatarFile) return;

		setIsUploading(true);
		setAvatarError(null);
		const formData = new FormData();
		formData.append('file', avatarFile);

		try {
			const response = await axios.post<AvatarUploadResponse>(`${API_BASE_URL}/api/users/avatar`, formData);
			const nextAvatarUrl = response.data.profile?.avatarUrl;
			if (nextAvatarUrl) setAvatarUrl(`${API_BASE_URL}${nextAvatarUrl}`);
			setAvatarFile(null);
			if (fileInputRef.current) fileInputRef.current.value = '';
		} catch (error) {
			if (axios.isAxiosError(error)) {
				setAvatarError(error.response?.data?.message ?? 'The avatar could not be uploaded.');
			} else {
				setAvatarError('The avatar could not be uploaded.');
			}
		} finally {
			setIsUploading(false);
		}
	};

  const initials = username.slice(0, 2).toUpperCase();

  return (
	<main className="min-h-screen bg-background font-sans text-text">
	  <header className="flex h-18 items-center justify-between border-b border-border bg-surface px-5 sm:px-8">
		<button
		  type="button"
		  className="flex items-center gap-3 text-left"
		  onClick={() => navigate('/dashboard')}
		>
		  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-serif text-xl text-background">t</span>
		  <span className="font-serif text-xl tracking-[-0.03em]">transcendence</span>
		</button>
		<Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
		  Back to feed
		</Button>
	  </header>

	  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
		<div className="mb-8 border-b border-border pb-6">
		  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Account</p>
		  <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em]">Your profile</h1>
		  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
			Keep your identity and public details ready for the community.
		  </p>
		</div>

		<div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
		  <Card tag="Public profile" title="Profile details" className="max-w-none">
			<div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
							<div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary bg-surface-raised font-serif text-2xl text-primary-soft">
								{avatarPreview || avatarUrl ? (
									<img src={avatarPreview ?? avatarUrl ?? ''} alt="Your avatar" className="h-full w-full object-cover" />
								) : initials}
			  </div>
			  <div>
				<p className="font-serif text-2xl text-text">{username}</p>
				<p className="text-sm text-muted">@{username || 'user'}</p>
			  </div>
			</div>

			<div className="mb-8 border-b border-border pb-6">
			  <div className="flex flex-wrap items-end justify-between gap-4">
				<div>
				  <p className="font-serif text-lg text-text">Profile photo</p>
				  <p className="mt-1 text-sm text-muted">JPG or PNG, up to 2 MB.</p>
				</div>
				<div className="flex flex-wrap gap-3">
				  <input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png"
					onChange={handleAvatarChange}
					className="block max-w-full text-sm text-muted file:mr-3 file:rounded-control file:border-0 file:bg-surface-raised file:px-3 file:py-2 file:font-sans file:text-sm file:font-medium file:text-text file:hover:bg-border"
				  />
				  <Button type="button" onClick={() => void uploadAvatar()} disabled={!avatarFile || isUploading}>
					{isUploading ? 'Uploading...' : 'Upload photo'}
				  </Button>
				</div>
			  </div>
			  {avatarError && <p className="mt-3 text-sm text-red-300" role="alert">{avatarError}</p>}
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
			  <Input
				label="Username"
				value={username}
				onChange={(event) => setUsername(event.target.value)}
				placeholder="Choose a username"
			  />
			  <Input
				label="Email address"
				type="email"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				placeholder="you@example.com"
			  />
			</div>

			<label className="mt-5 block max-w-sm text-xs font-medium text-text-soft">
			  Bio
			  <textarea
				value={bio}
				onChange={(event) => setBio(event.target.value)}
				rows={4}
				className="mt-1.5 w-full resize-y rounded-control border border-border bg-surface-raised px-4 py-2.5 text-sm text-text placeholder-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
				placeholder="Tell the community a little about yourself"
			  />
			</label>

			<div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
			  <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
				Cancel
			  </Button>
			  <Button type="button" onClick={() => setShowSaveModal(true)}>
				Save changes
			  </Button>
			</div>
		  </Card>

		  <div className="space-y-6">
			<Card tag="Overview" title="Account snapshot" className="max-w-none">
			  <dl className="space-y-4">
				<div className="flex items-center justify-between gap-4 border-b border-border pb-3">
				  <dt className="text-muted">Member since</dt>
				  <dd className="text-right text-text">September 2026</dd>
				</div>
				<div className="flex items-center justify-between gap-4 border-b border-border pb-3">
				  <dt className="text-muted">Posts</dt>
				  <dd className="text-text">12</dd>
				</div>
				<div className="flex items-center justify-between gap-4">
				  <dt className="text-muted">Challenges</dt>
				  <dd className="text-text">4 completed</dd>
				</div>
			  </dl>
			</Card>

			<Card tag="Next step" title="Account security" className="max-w-none">
			  <p>Keep your password and sign-in methods up to date as the account grows.</p>
			  <Button type="button" variant="secondary" className="mt-5" onClick={() => setShowSaveModal(true)}>
				Manage sign-in
			  </Button>
			</Card>
		  </div>
		</div>
	  </div>

	  <Modal
		isOpen={showSaveModal}
		onClose={() => setShowSaveModal(false)}
		title="Profile skeleton"
		footerActions={
		  <Button type="button" onClick={() => setShowSaveModal(false)}>
			Got it
		  </Button>
		}
	  >
		This profile page is ready for the backend update endpoint. Your edits are currently local to this page.
	  </Modal>
	</main>
  );
}

export default function Profile() {
  return (
	<ProtectedRoute>
	  <ProfileContent />
	</ProtectedRoute>
  );
}