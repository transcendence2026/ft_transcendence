import { Body, Controller, Get, Inject, Query, Redirect, Req, UseGuards, Post } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from './auth.guard.js';
import { AuthService } from './auth.service.js';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: { username?: string; email?: string; password?: string }) {
    return this.authService.register(body.username, body.email, body.password);
  }

  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('oauth/42')
  @Redirect()
  oauth42() {
    return { url: this.authService.buildOAuthUrl(), statusCode: 302 };
  }

  @Get('oauth/42/callback')
  @Redirect()
  async oauth42Callback(@Query('code') code = '', @Query('state') state = '') {
    return { url: await this.authService.handleOAuthCallback(code, state), statusCode: 302 };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.user!.id);
  }
}