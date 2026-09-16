import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
    @IsString()
    @IsNotEmpty()
    readonly username!: string;

    @IsEmail()
    @IsNotEmpty()
    readonly email!: string;

    @IsString()
    @MinLength(8)
    readonly password!: string;
}