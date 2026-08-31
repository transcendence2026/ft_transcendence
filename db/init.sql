CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO messages (text)
SELECT 'Database connection is working.'
WHERE NOT EXISTS (SELECT 1 FROM messages);
