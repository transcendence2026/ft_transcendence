import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

function ProfileContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username ?? 'user');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState('Learning, competing, and building with the community.');
  const [showSaveModal, setShowSaveModal] = useState(false);

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
			  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary bg-surface-raised font-serif text-2xl text-primary-soft">
				{initials}
			  </div>
			  <div>
				<p className="font-serif text-2xl text-text">{username}</p>
				<p className="text-sm text-muted">@{username || 'user'}</p>
			  </div>
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