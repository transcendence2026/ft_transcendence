import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { useEffect } from "react";

function DashboardContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { sendMessage, messages, status } = useWebSocket();
  const username = user?.username ?? "user";

  const navigation = [
    { label: "Home", icon: "⌂", active: true },
    { label: "Discover", icon: "◌" },
    { label: "Messages", icon: "□" },
    { label: "Notifications", icon: "☆" },
  ];

const posts = [
    {
      author: "Maya Chen",
      handle: "@mayachen",
      time: "18 min",
      initials: "MC",
      accent: "bg-primary",
      body: "The weekend brunch rush is almost here. Who is prepping their starter dough for the opening bake?",
      likes: "24",
      comments: "6",
    },
    {
      author: "Alex Rivera",
      handle: "@alexr",
      time: "1 h",
      initials: "AR",
      accent: "bg-primary-soft",
      body: "Fresh herbs, balanced acidity, and a much cleaner plating style than yesterday. That is the whole plan.",
      likes: "41",
      comments: "12",
    },
    {
      author: "Tournament Desk",
      handle: "@transcendence",
      time: "3 h",
      initials: "TD",
      accent: "bg-secondary",
      body: "Baking challenge starts at 20:00. Grab an apron, share your secret ingredient, and cook something memorable.",
      likes: "68",
      comments: "18",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRejoindreSalon = () => {
    // Ton sendMessage convertit déjà les objets en JSON, c'est parfait !
    sendMessage({ event: 'joinRoom', roomName: 'general' });
  }


  useEffect(() => {
    console.log("Statut WebSocket :", status);
  }, [status]);

  useEffect(() => {
    console.log("Messages reçus:", messages);
  }, [messages]);


  return (
    <main className="min-h-screen bg-background font-sans text-text">
      <header className="flex h-18 items-center justify-between border-b border-border bg-surface px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-serif text-xl text-background">t</div>
          <span className="font-serif text-xl tracking-[-0.03em]">transcendence</span>
        </div>
        <div className="flex items-center gap-4">
			<Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="sm:inline justify-center border-t border-border text-muted hover:text-primary-soft"
          >
            Profile
          </Button>
          <span className="hidden text-sm text-muted sm:inline">{user?.email ?? "signed in"}</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary bg-surface-raised text-xs font-bold text-primary-soft">
            {username.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-border px-5 py-8 md:block">
          <div className="mb-8 flex items-center gap-3 border-b border-border pb-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-sm font-bold text-primary-soft">{username.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="truncate font-serif text-lg">{username}</p>
              <p className="truncate text-xs text-muted">@{username}</p>
            </div>
          </div>
		<nav aria-label="Main navigation" className="space-y-2">
			{navigation.map((item) => (
				<Button
				key={item.label}
				type="button"
				variant={item.active ? "primary" : "ghost"}
				className={`flex w-full !justify-start items-center gap-4 rounded px-4 py-3 text-left text-sm ${
					item.active 
					? "font-semibold" 
					: "text-muted hover:bg-surface-raised hover:text-text"
				}`}
				>
				<span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-lg leading-none">
					{item.icon}
				</span>
				<span className="truncate">{item.label}</span>
				</Button>
			))}
		</nav>

          <Button
            type="button"
            onClick={handleRejoindreSalon}
            className="rounded border border-[#ef6540] px-4 py-2 font-sans text-sm font-semibold text-[#ffb4a1] transition-colors hover:bg-[#ef6540]/10"
          >
            joinRoom
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            variant="danger"
            className="mt-8 w-fit border-t border-border px-4 pt-6 text-left text-sm"
          >
            Log out
          </Button>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:max-w-3xl lg:px-12">
          <div className="mb-6 flex items-end justify-between border-b border-border pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Your feed</p>
              <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em]">Good to see you, {username}.</h1>
            </div>
            <Button type="button" variant="ghost" className="hidden rounded border border-border px-3 py-2 text-xs text-muted hover:border-primary hover:text-primary-soft sm:block">Latest</Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 rounded border border-border bg-surface p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-primary-soft">{username.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1 rounded border border-border px-4 py-3 text-sm text-muted">Share something with the community...</div>
            </div>

            {posts.map((post) => (
              <article key={post.handle} className="rounded border border-border bg-surface p-5 transition-colors hover:border-surface-raised">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background ${post.accent}`}>{post.initials}</div>
                    <div>
                      <p className="text-sm font-semibold">{post.author}</p>
                      <p className="mt-0.5 text-xs text-muted">{post.handle} <span className="px-1">·</span> {post.time}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" aria-label={`More options for ${post.author}`} className="px-2 py-0 text-lg leading-none text-muted hover:text-text">...</Button>
                </div>
                <p className="mt-5 font-serif text-lg leading-relaxed text-text">{post.body}</p>
                <div className="mt-5 flex gap-6 border-t border-border pt-4 text-xs text-muted">
                  <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted hover:text-primary-soft">♡ {post.likes}</Button>
                  <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted hover:text-primary-soft">□ {post.comments}</Button>
                  <Button type="button" variant="ghost" className="px-0 py-0 text-xs text-muted hover:text-primary-soft">↗ Share</Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="hidden w-72 shrink-0 border-l border-border px-6 py-8 xl:block">
          <Card tag="Community pulse" title="Learn together." className="max-w-none rounded-none border-0 border-b border-border bg-transparent p-0 pb-6 shadow-none">
            <p className="mt-2 text-sm leading-relaxed text-muted">Share your favourite dishes and drool over the others</p>
          </Card>
          <Card tag="Trending today" title="What's moving" className="mt-6 max-w-none rounded-none border-0 bg-transparent p-0 shadow-none">
            <div className="mt-4 space-y-5">
              <div><p className="text-xs text-muted">01 / competition</p><p className="mt-1 text-sm font-semibold">Opening round energy</p></div>
              <div><p className="text-xs text-muted">02 / community</p><p className="mt-1 text-sm font-semibold">Find your cooking partner</p></div>
              <div><p className="text-xs text-muted">03 / practice</p><p className="mt-1 text-sm font-semibold">Learn these recipes</p></div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
