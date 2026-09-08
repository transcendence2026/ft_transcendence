import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserPayload } from "../interfaces/user-payload.interface.js";

//@CurrentUser (Decorador de Parámetro)
//Actua como un getter qu extrae el payload del user
//antes se guardo en request.user por JwtAuthGuard
//createParamDecorator es una herramienta que te da NestJS. 
// Le pasas una función dentro como si fuera una "receta", 
// y NestJS se encarga de convertirla en un decorador (@CurrentUser).
//Al declararlo se pone sin @ (al usarlo sí se le pondra @ Ej: getProfile(@CurrentUser() user: UserPayload) { ... } )
export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) : UserPayload => {
		const request = ctx.switchToHttp().getRequest();
    	return request.user;
	},
);