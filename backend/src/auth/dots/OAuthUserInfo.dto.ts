import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';

export class OAuthUserInfoDto {
    @IsString()
    @IsNotEmpty()
    readonly login!: string

    @IsEmail()
    @IsNotEmpty()
    readonly email!: string

    @IsString()
    @IsNotEmpty()
    readonly firstName!: string

}
