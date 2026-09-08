import { Router, type Response } from 'express';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthRequest } from '../types/index.js';

const router = Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('_id username email bio avatarUrl').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: String(user._id),
      username: user.username,
	  email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return res.status(500).json({ message: 'Failed to fetch current user' });
  }
});

export default router;