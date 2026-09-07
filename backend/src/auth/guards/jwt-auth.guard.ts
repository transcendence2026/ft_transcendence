//Creamos un guard de prueba temporal
//que intercepta la peticion antes de que llegue a los controladores
//como no hay todavia base de datos de usuarios
//se inyecta un usuario de prueba respetando el molde UserPayload
//como es de prueba devuelve true (como si tuviera una credencial valida)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../interfaces/user-payload.interface.js';

 // @Injectable() registra esta clase en el sistema de inyección de dependencias de NestJS.
 // Actúa como una plantilla o instancia compartida (Singleton) gestionado por el framework:
 // evita crear instancias manuales con 'new' y cualquier cambio en este guard se propaga 
 // automáticamente a todas las rutas protegidas (unico punto de modificacion para todo el sistema)
 //ej.No hay 50 objetos del guard (una unica instancia) desperdigados por el servidor.
@Injectable()
export class JwtAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		//1.- Obtenemos el objeto de la peticion web HTTP
		const request = context.switchToHttp().getRequest();
		//2.- Creamos los datos simulados cumpliendo el contrato UserPayload definido en interfaces
		const mockUser: UserPayload = {
			id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
			username: 'patquesa_dev',
			email: 'patquesa@tastesync.42',
			roles: ['USER'],
		};
		//3.- Modificamos el objeto request y le añadimos la propiedad .user con los datos simulados
		request.user = mockUser;
		//4.- Concedemos el acceso a la ruta
		return true;
	}
}

