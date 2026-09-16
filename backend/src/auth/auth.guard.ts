import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.header('Authorization')?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token, authorization denied');
    }

    try {
      request.user = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret-change-me') as { id: string };
      return true;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('Token is not valid');
    }
  }
}