import { Schema, model } from 'mongoose';
import { Router } from 'express';

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

const router = Router();

router.get('/', async (_request, response) => {
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

export default router