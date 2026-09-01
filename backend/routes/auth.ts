import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();
const oauthStateStore = new Map<string, string>();

const createJwt = (userId: string) => jwt.sign({ id: userId }, process.env.JWT_SECRET ?? 'dev-secret-change-me', { expiresIn: '1d' });

const build42AuthUrl = (state: string) => {
  const clientId = process.env.FORTY_TWO_CLIENT_ID;
  const redirectUri = process.env.FORTY_TWO_REDIRECT_URI ?? 'http://localhost:3000/api/auth/oauth/42/callback';

  if (!clientId) {
    throw new Error('42 OAuth is not configured. Set FORTY_TWO_CLIENT_ID.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'public',
    state,
  });

  return `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
};

const sanitizeUsername = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, '').slice(0, 20) || 'user';

const ensureUniqueUsername = async (preferredUsername: string) => {
  let candidate = sanitizeUsername(preferredUsername);
  let suffix = 1;

  while (await User.exists({ username: candidate })) {
    candidate = `${sanitizeUsername(preferredUsername)}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as { username?: string; email?: string; password?: string };

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username: String(username).trim() }] });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const safeUsername = await ensureUniqueUsername(String(username));
    const user = new User({
      username: safeUsername,
      email: normalizedEmail,
      password: String(password),
    });

    await user.save();
    const token = createJwt(String(user._id));

    return res.status(201).json({
      token,
      user: { username: user.username, email: user.email },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Failed to register user' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = createJwt(String(user._id));
    return res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message ?? 'Failed to log in' });
  }
});

router.get('/oauth/42', (_req: Request, res: Response) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    oauthStateStore.set(state, '42');
    const redirectUrl = build42AuthUrl(state);
    return res.redirect(redirectUrl);
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? '42 OAuth is not configured' });
  }
});

router.get('/oauth/42/callback', async (req: Request, res: Response) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';

    if (!code || !state || !oauthStateStore.has(state)) {
      return res.status(400).json({ message: 'Invalid OAuth callback state' });
    }

    oauthStateStore.delete(state);

    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.FORTY_TWO_CLIENT_ID ?? '',
        client_secret: process.env.FORTY_TWO_CLIENT_SECRET ?? '',
        code,
        redirect_uri: process.env.FORTY_TWO_REDIRECT_URI ?? 'http://localhost:3000/api/auth/oauth/42/callback',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      return res.status(401).json({ message: 'Failed to exchange 42 authorization code' });
    }

    const tokenPayload: { access_token?: string } = await tokenResponse.json();
    const accessToken = tokenPayload.access_token;

    if (!accessToken) {
      return res.status(401).json({ message: '42 token exchange returned no access token' });
    }

    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      return res.status(401).json({ message: 'Failed to fetch user details from 42 API' });
    }

    const userInfo: { login?: string; email?: string; first_name?: string; last_name?: string } = await userResponse.json();
    const login = userInfo.login ?? userInfo.first_name ?? '42user';
    const email = userInfo.email ?? `${login}@student.42.fr`;

    let user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user) {
      const username = await ensureUniqueUsername(login);
      user = new User({
        username,
        email: String(email).trim().toLowerCase(),
        password: crypto.randomBytes(24).toString('hex'),
      });
      await user.save();
    }

    const jwtToken = createJwt(String(user._id));
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8080';
    const callbackUrl = new URL('/oauth/callback', frontendUrl);
    callbackUrl.searchParams.set('token', jwtToken);
    callbackUrl.searchParams.set('username', user.username);
    callbackUrl.searchParams.set('email', user.email);

    return res.redirect(callbackUrl.toString());
  } catch (error: any) {
    console.error('42 OAuth error:', error);
    return res.status(500).json({ message: error.message ?? '42 OAuth failed' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.id).select('username email');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: { username: user.username, email: user.email } });
});

export default router;