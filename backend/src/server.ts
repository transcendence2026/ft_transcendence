import cors from 'cors';
import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    response.status(503).json({ status: 'error' });
  }
});

app.get('/api/messages', async (_request, response) => {
  const result = await pool.query(
    'SELECT id, text, created_at FROM messages ORDER BY created_at DESC'
  );
  response.json(result.rows);
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
