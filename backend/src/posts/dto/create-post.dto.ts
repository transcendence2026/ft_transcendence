import { IsArray, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsArray()
  @Matches(/^\/uploads\/posts\/[A-Za-z0-9._-]+$/, {
    each: true,
    message: 'Each image URL must be a local post upload path',
  })
  imageUrls?: string[];
}
