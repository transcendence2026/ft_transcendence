//Register-User
//Importamos las herramientas esenciales de validacion de la libreria class-validator
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

//creamos una clase con los datos obligatorios para el registro
export class RegisterUserDto {
	//@IsEmail({}, { message: 'Invalid email address'})
	//Esta expresión valida cualquier estructura de correo estándar y además permite dominios personalizados
	@Matches(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, {
        message: 'Invalid email address format',
	})
	email!: string;

	@IsString({ message: 'Username must be a string' })
	@MinLength(3, { message: 'Username must be at least 3 characters long'})
	username!: string;

	@IsString({ message: 'Password must be a string' })
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	//Al menos \d numero o \W+ simbolo/especial, [A-Z] al menos una MAY y [a-z] al menos una Min
	@Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
		message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number or symbol' 
	})
	password!: string;
}