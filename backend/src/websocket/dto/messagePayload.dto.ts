import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class MessagePayloadDto {
    @IsString()
    @IsNotEmpty()
    readonly roomName!: string

    @IsString()
    @IsNotEmpty()
    readonly message!: string
}

export class JoinRoomDto {
    @IsString()
    @IsNotEmpty()
    readonly roomName!: string
}

export class DirectMessageDto {
    @IsString()
    @IsNotEmpty()
    readonly receiverId!: string

    @IsString()
    @IsNotEmpty()
    readonly text!: string
}

export class TypingDto {
    @IsString()
    @IsNotEmpty()
    readonly receiverId!: string

    @IsBoolean()
    @IsOptional()
    readonly isTyping?: boolean
}