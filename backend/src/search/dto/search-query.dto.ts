import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Cuisine } from '@prisma/client';

// "?cuisine=" arrives as '' and would fail validation, so treat it as "not provided"
const emptyToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class SearchQueryDto {
  @IsOptional()
  @emptyToUndefined()
  @IsEnum(Cuisine)
  cuisine?: Cuisine;

  // Restaurant.priceRange is 1-4
  @IsOptional()
  @emptyToUndefined()
  @Type(() => Number) // query params are always strings
  @IsInt()
  @Min(1)
  @Max(4)
  price?: number;

  // Minimum average rating
  @IsOptional()
  @emptyToUndefined()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  // Free text search
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

  @IsOptional()
  @emptyToUndefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}