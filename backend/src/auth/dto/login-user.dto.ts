//Importa herramientas para validar Inicio de sesion
import { IsEmail, IsString, MinLength } from 'class-validator';
export class LoginUserDto {
	//q tenga formato estandar ej: usuario@dominio.com
	@IsEmail({}, { message: 'Invalid email address' })
	email!: string;
	//que la contraseña no este vacia
	@IsString({ message: 'Password must be a string' })
	@MinLength(1, { message: 'Password cannot be empty' })
	password!: string;
}