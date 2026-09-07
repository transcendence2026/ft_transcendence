import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get('/', async (_request, response) => {
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

export default router;
