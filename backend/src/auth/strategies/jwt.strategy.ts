import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../interfaces/user-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            // ¿Dónde busca el token? En la cabecera HTTP de la petición, 
        	// buscando la palabra "Bearer <token>" (ej: Authorization: Bearer eyJhbGci...)
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // ¿Qué pasa si el token ha caducado? No lo ignoramos (false). 
        	// Si expiró, se rechaza la petición automáticamente.
            ignoreExpiration: false,
            //Obtenemos la clave secreta con la que se firmó el token (desde las variables de entorno .env)
            secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKeyDefault',
        });
    }

    // 4. Este método se ejecuta automáticamente si el token es válido y no ha expirado
    async validate(payload: any): Promise<UserPayload> {
        // El 'payload' contiene lo que firmamos en el login: sub (id) y email.
        // Lo devolvemos estructurado para que se inyecte automáticamente en request.user
        return {
            id: payload.sub,
            email: payload.email,
			username: payload.username,
        	role: payload.role,
        };
    }
}