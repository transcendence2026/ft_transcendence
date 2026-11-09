import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express'
import { UserPayload } from '../interfaces/user-payload.interface.js';

@Injectable()
// JwtStrategy inherits from PassportStrategy(Strategy) 
// so that Passport handles the cryptographic verification of the token
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            //extracts only the 'accessToken' from the HttpOnly cookie
            jwtFromRequest: (req: Request) => {
                return req?.cookies?.accessToken || null;
            }, 
            // It is checked whether it has expired
            ignoreExpiration: false,
            //the validity of the token is checked using the secret key JWT_SECRET with which it was signed
            secretOrKey: process.env.JWT_SECRET || 'super-secret',
			algorithms: ['HS256'],
        });
    }

   //Passport injects the payload and returns only what the application needs
   //Passport injects the return value of validate() directly into request.user
    async validate(payload: any): Promise<UserPayload> {
        return {
            id: payload.id,
            email: payload.email,
			username: payload.username,
        	role: payload.role,
        };
    }
}