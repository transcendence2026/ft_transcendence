import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema.js';

type OAuthUserInfo = { login?: string; email?: string; first_name?: string };

@Injectable()
export class AuthService {
  private readonly oauthStateStore = new Map<string, string>();

  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  private createJwt(userId: string): string {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET ?? 'dev-secret-change-me', { expiresIn: '1d' });
  }

  private sanitizeUsername(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '').slice(0, 20) || 'user';
  }

  private async ensureUniqueUsername(preferredUsername: string): Promise<string> {
    const base = this.sanitizeUsername(preferredUsername);
    let candidate = base;
    let suffix = 1;
    while (await this.userModel.exists({ username: candidate })) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async register(username?: string, email?: string, password?: string) {
    if (!username || !email || !password) {
      throw new BadRequestException('Username, email and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await this.userModel.findOne({ $or: [{ email: normalizedEmail }, { username: String(username).trim() }] });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.userModel.create({
      username: await this.ensureUniqueUsername(String(username)),
      email: normalizedEmail,
      password: String(password),
    });
    return { token: this.createJwt(String(user._id)), user: { username: user.username, email: user.email } };
  }

  async login(email?: string, password?: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userModel.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await user.comparePassword(String(password)))) {
      throw new BadRequestException('Invalid credentials');
    }

    return { token: this.createJwt(String(user._id)), user: { username: user.username, email: user.email } };
  }

  buildOAuthUrl(): string {
    const clientId = process.env.FORTY_TWO_CLIENT_ID;
    if (!clientId) {
      throw new InternalServerErrorException('42 OAuth is not configured. Set FORTY_TWO_CLIENT_ID.');
    }

    const state = crypto.randomBytes(16).toString('hex');
    this.oauthStateStore.set(state, '42');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: process.env.FORTY_TWO_REDIRECT_URI ?? 'http://localhost:3000/api/auth/oauth/42/callback',
      response_type: 'code',
      scope: 'public',
      state,
    });
    return `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, state: string): Promise<string> {
    if (!code || !state || !this.oauthStateStore.has(state)) {
      throw new BadRequestException('Invalid OAuth callback state');
    }
    this.oauthStateStore.delete(state);

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
    if (!tokenResponse.ok) throw new UnauthorizedException('Failed to exchange 42 authorization code');

    const tokenPayload = await tokenResponse.json() as { access_token?: string };
    if (!tokenPayload.access_token) throw new UnauthorizedException('42 token exchange returned no access token');

    const userResponse = await fetch('https://api.intra.42.fr/v2/me', { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } });
    if (!userResponse.ok) throw new UnauthorizedException('Failed to fetch user details from 42 API');

    const userInfo = await userResponse.json() as OAuthUserInfo;
    const login = userInfo.login ?? userInfo.first_name ?? '42user';
    const email = String(userInfo.email ?? `${login}@student.42.fr`).trim().toLowerCase();
    let user = await this.userModel.findOne({ email });
    if (!user) {
      user = await this.userModel.create({ username: await this.ensureUniqueUsername(login), email, password: crypto.randomBytes(24).toString('hex') });
    }

    const callbackUrl = new URL('/oauth/callback', process.env.FRONTEND_URL ?? 'http://localhost:8080');
    callbackUrl.searchParams.set('token', this.createJwt(String(user._id)));
    callbackUrl.searchParams.set('username', user.username);
    callbackUrl.searchParams.set('email', user.email);
    return callbackUrl.toString();
  }

  async getCurrentUser(id: string) {
    const user = await this.userModel.findById(id).select('username email');
    if (!user) throw new UnauthorizedException('User not found');
    return { user: { username: user.username, email: user.email } };
  }
}