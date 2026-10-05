import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express'
import { UserPayload } from '../interfaces/user-payload.interface.js';

@Injectable()
//PassportStrategy: es un adaptador para que NestJS pueda usar
//la libreria de autenticación Passport de NodeJS
//ConfigService: un servicio especializado que se encarga de
//leer el archivo .env al arrancar el servidor, 
//validar que todo esté en orden, 
//y poder obtener estas variables mediante el método .get()
//Como nuestra clase JwtStrategy hereda de la clase de Passport (extends PassportStrategy(Strategy)),
// estamos obligados a llamar a la función super()
export class JwtStrategy extends PassportStrategy(Strategy) {
    //constructor(private readonly configService: ConfigService) {
    constructor() {
        super({
            //extrae unicamente de la cookie HttpOnly 'accessToken'
            //el navegador adjunta esta cookie automaticamente en req.cookies
            jwtFromRequest: (req: Request) => {
                return req?.cookies?.accessToken || null;
            }, 
            // ¿Qué pasa si el token ha caducado? No lo ignoramos (false). 
        	// Si expiró, se rechaza la petición automáticamente.
            ignoreExpiration: false,
            //Obtenemos la clave secreta JWT_SECRET con la que se firmó el token (dentro de .env)
			//para comprobar la validez del token
            secretOrKey: process.env.JWT_SECRET || 'super-secret',
        });
    }

    // 4. Este método se ejecuta automáticamente si el token es válido y no ha expirado
	//El método validate es el puente que convierte ese texto cifrado del token
	//en un objeto accesible al instante para tu código
    async validate(payload: any): Promise<UserPayload> {
        // El 'payload' contiene lo que firmamos en el login: sub (id) y email.
        // Lo devolvemos estructurado para que se inyecte automáticamente en request.user
        return {
            id: payload.id,
            email: payload.email,
			username: payload.username,
        	role: payload.role,
        };
    }
}