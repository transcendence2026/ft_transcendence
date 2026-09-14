import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDto {
    @IsEmail()
    @IsNotEmpty()
    readonly email!: string;

    @IsString()
    @MinLength(8)
    readonly password!: string;
}