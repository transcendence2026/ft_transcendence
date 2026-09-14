import { IsNotEmpty, IsString } from "class-validator";


export class MessagePayloadDto {
    @IsString()
    @IsNotEmpty()
    readonly roomName!: string

    @IsString()
    @IsNotEmpty()
    readonly message!: string
}