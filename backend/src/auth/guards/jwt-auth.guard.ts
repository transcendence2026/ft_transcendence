import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserPayload } from '../interfaces/user-payload.interface.js';

 // @Injectable() es un Decorador de Clase: registra esta clase en el sistema de inyección de dependencias de NestJS.
 // Actúa como una plantilla o instancia compartida (Singleton) gestionado por el framework:
 // evita crear instancias manuales con 'new' y cualquier cambio en este guard se propaga 
 // automáticamente a todas las rutas protegidas (unico punto de modificacion para todo el sistema)
 //ej.No hay 50 objetos del guard (una unica instancia) desperdigados por el servidor.
@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
        @Inject(JwtService) private readonly jwtService: JwtService, //Le pide a NestJS que le entregue la herramienta (JwtService) para descifrar y validar tokens
    ) {}
	//punto de entrada que se ejecuta cada vez que alguien intenta acceder
	async canActivate(context: ExecutionContext): Promise<boolean> {
		//1.- Obtenemos el objeto de la peticion web HTTP
		const request = context.switchToHttp().getRequest();
		//2.-Extraemos el token del encabezado 'Authorization'
		const token = this.extractTokenFromHeader(request);
		if(!token) {
			throw new UnauthorizedException('Access token not found');
		}
		try {
			//3.- Verificamos y decodificamos el token usando la clave secreta con JwtService
			//Usamos la funcion verifyAsync de la herramienta jwtServoce
			const payload: UserPayload = await this.jwtService.verifyAsync(token);
			//4.- Inyectamos el payload decodificado en request.user
			request.user = payload;
			return true;
		} catch {
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
	//Cuando cliente manda peticion, de manera estandar le precede Bearer
    //Extrae y devuelve el token limpio (o undefined si no hay nada)
    //Separa el esquema de autenticación (ej. 'Bearer') del código cifrado del token
    //dividiendo el texto por los espacios.
	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
