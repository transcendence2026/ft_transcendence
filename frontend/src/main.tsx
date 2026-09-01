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
  const [messagesError, setMessagesError] = useState('');

  useEffect(() => {
	fetch(`${apiUrl}/api/health`)
	  .then((response) => {
		if (!response.ok) throw new Error('Health check failed');
		return response.json() as Promise<HealthResponse>;
	  })
	  .then((health) => setStatus(health.status === 'ok' ? 'All systems online' : 'Backend unavailable'))
	  .catch(() => setStatus('Backend unavailable'));

	fetch(`${apiUrl}/api/messages`)
	  .then((response) => {
		if (!response.ok) throw new Error('Messages request failed');
		return response.json() as Promise<Message[]>;
	  })
	  .then(setMessages)
	  .catch(() => setMessagesError('Unable to load messages'));
  }, []);

  return (
	<main>
	  <p className="eyebrow">ft_transcendence / container stack</p>
	  <h1>Three services.<br /><em>One starting point.</em></h1>
	  <p className="intro">A React frontend, an Express API, and MongoDB are running together through Docker Compose.</p>
	  <section className="status-panel">
		<span className="status-dot" />
		<strong>{status}</strong>
		<span className="endpoint">API :3000 / DB :5432</span>
	  </section>
	  <section className="messages">
		<h2>Database messages</h2>
		{messagesError && <p>{messagesError}</p>}
		{messages.map((message) => <p key={message.id}>{message.text}</p>)}
	  </section>
	</main>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
