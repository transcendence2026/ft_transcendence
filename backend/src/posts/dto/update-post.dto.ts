import { IsArray, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(200)
	title?: string;

	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(10000)
	content?: string;

	@IsOptional()
	@IsArray()
	@IsUrl({}, { each: true })
	imageUrls?: string[];
}
