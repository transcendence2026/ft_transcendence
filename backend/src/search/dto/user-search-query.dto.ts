import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const DEFAULT_LIMIT = 10;

// "?q=" arrives as '' and would fail validation, so treat it as "not provided"
const emptyToUndefined = () =>
	Transform(({ value, obj, key }) => (obj[key] === '' ? undefined : value));

export class UserSearchQueryDto {
	// Free text search (username, first name, last name)
	@IsOptional()
	@emptyToUndefined()
	@IsString()
	@MaxLength(100)
	q?: string;

	// id of the last item of the previous page
	@IsOptional()
	@emptyToUndefined()
	@IsString()
	cursor?: string;

	// "?limit=" falls back to the dafault instead of becoming undefined
	@IsOptional()
	@Transform(({ value, obj, key }) => (obj[key] === '' ? DEFAULT_LIMIT : value))
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	limit: number = DEFAULT_LIMIT;
}