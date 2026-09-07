import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from '../routes/auth.js';
import healthRoutes from '../routes/health.js';
import messagesRoutes from '../routes/messages.js';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const mongoUri = process.env.DATABASE_URL ?? 'mongodb://db:27017';
const dbName = process.env.MONGO_DB ?? 'transcendence';
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/message', messagesRoutes);
app.use('/api/health', healthRoutes)

wss.on('connection', (ws) => {
    console.log('Un nouveau client (navigateur) vient de se connecter.');

    ws.send('Bienvenue sur le WebSocket !');

    ws.on('message', (message) => {
        const messageTexte = message.toString();
        console.log('Reçu du client : ', messageTexte);

        ws.send(`J'ai bien reçu ton message : "${messageTexte}"`);
    });

    ws.on('close', () => {
        console.log('Le client a fermé la page ou perdu la connexion.');
    });
});

mongoose.connect(mongoUri, { dbName })
  .then(() => {
    console.log('Connected to MongoDB via Mongoose');
    server.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Unable to connect to MongoDB', error);
    process.exit(1);
  });