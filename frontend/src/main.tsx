import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

interface HealthResponse {
  status: 'ok' | 'error';
}

interface Message {
  id: number;
  text: string;
  created_at: string;
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [status, setStatus] = useState('Checking backend...');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/health`).then((response) => response.json() as Promise<HealthResponse>),
      fetch(`${apiUrl}/api/messages`).then((response) => response.json() as Promise<Message[]>),
    ])
      .then(([health, loadedMessages]) => {
        setStatus(health.status === 'ok' ? 'All systems online' : 'Backend unavailable');
        setMessages(loadedMessages);
      })
      .catch(() => setStatus('Backend unavailable'));
  }, []);

  return (
    <main>
      <p className="eyebrow">ft_transcendence / container stack</p>
      <h1>Three services.<br /><em>One starting point.</em></h1>
      <p className="intro">A React frontend, an Express API, and PostgreSQL are running together through Docker Compose.</p>
      <section className="status-panel">
        <span className="status-dot" />
        <strong>{status}</strong>
        <span className="endpoint">API :3000 / DB :5432</span>
      </section>
      <section className="messages">
        <h2>Database messages</h2>
        {messages.map((message) => <p key={message.id}>{message.text}</p>)}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
