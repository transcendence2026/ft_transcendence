import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
		// Application credentials registered in the API
      clientID: process.env.FORTY_TWO_CLIENT_ID,
      clientSecret: process.env.FORTY_TWO_CLIENT_SECRET,
      callbackURL: process.env.FORTY_TWO_REDIRECT_URI || 'https://localhost:8443/api/auth/oauth/42/callback',
      scope: ['public'],
    });
  }

  // validate Intercepts and parses the profile payload to extract key user data (email and username) for generating an internal JWT.
  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { username, emails, image } = profile;
    return {
      email: emails && emails.length > 0 ? emails[0].value : `${username}@student.42malaga.com`,
      username: username,
      avatarUrl: image?.link || '',
    };
  }
}
