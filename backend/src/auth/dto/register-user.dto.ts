
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

// Defines the required payload and validation rules for user registration.
export class RegisterUserDto {
	// Validates any standard email format while supporting custom domains.
	@Matches(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, {
        message: 'Invalid email address format',
	})
	email!: string;

	@IsString({ message: 'Username must be a string' })
	@MinLength(3, { message: 'Username must be at least 3 characters long'})
	@Matches(/^[a-zA-Z0-9_-]+$/, {
    	message: 'Username can only contain letters, numbers, underscores, and hyphens',
	})
	username!: string;

	@IsString({ message: 'Password must be a string' })
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	// Requires at least one number (\d) or special character (\W+), 
	// one uppercase letter ([A-Z]), and one lowercase letter ([a-z]).
	@Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
		message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number or symbol' 
	})
	password!: string;
}