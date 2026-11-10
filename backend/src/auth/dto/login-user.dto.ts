import { IsEmail, IsString, MinLength } from 'class-validator';

// ensure incoming login requests contain a valid email
// and a non-empty password string.
export class LoginUserDto {
	
	@IsEmail({}, { message: 'Invalid email address' })
	email!: string;

	@IsString({ message: 'Password must be a string' })
	@MinLength(1, { message: 'Password cannot be empty' })
	password!: string;
}