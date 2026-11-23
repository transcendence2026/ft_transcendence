import { IsString, MaxLength, MinLength, Matches } from 'class-validator';

// ensure incoming login requests contain a valid email
// and a non-empty password string.
export class LoginUserDto {
	
	@MaxLength(254, { message: 'Email is too long' })
	@Matches(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, {
		message: 'Invalid email address',
	})
	email!: string;

	@IsString({ message: 'Password must be a string' })
	@MinLength(1, { message: 'Password cannot be empty' })
	@MaxLength(128, { message: 'Password is too long' })
	password!: string;
}