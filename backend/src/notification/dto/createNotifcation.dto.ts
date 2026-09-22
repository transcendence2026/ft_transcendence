import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateNotificationDto {

    @IsString()
    @IsNotEmpty()
    readonly senderId!: string

    @IsString()
    @IsNotEmpty()
    readonly receiverId!: string

    @IsString()
    @IsNotEmpty()
    readonly type!: string

    @IsString()
    @IsNotEmpty()
    readonly message!: string
}
