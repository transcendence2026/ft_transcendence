import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose, { Schema, model } from 'mongoose';
import authRoutes from '../routes/auth.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const mongoUri = process.env.DATABASE_URL ?? 'mongodb://db:27017';
const dbName = process.env.MONGO_DB ?? 'transcendence';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);

interface IMessage {
  text: string;
  sender: string;
  created_at: Date;
}

const messageSchema = new Schema<IMessage>({
  text: { type: String, required: true },
  sender: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const Message = model<IMessage>('Message', messageSchema);

app.get('/api/health', async (_request, response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      response.json({ status: 'ok' });
      return;
    }

    throw new Error('Database not connected');
  } catch (error) {
    console.error(error);
    response.status(503).json({ status: 'error' });
  }
});

app.get('/api/messages', async (_request, response) => {
  try {
    const messages = await Message.find({}, { _id: 0 })
      .sort({ created_at: -1 })
      .lean();

    response.json(messages);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Failed to fetch messages' });
  }
});

mongoose.connect(mongoUri, { dbName })
  .then(() => {
    console.log('Connected to MongoDB via Mongoose');
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error('Unable to connect to MongoDB', error);
    process.exit(1);
  });