import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { IsUlid } from '../../common/validators/is-ulid.validator';

export class SearchPurchasesDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsUlid() purchaseCategoryId?: string;
  @IsOptional() @IsDateString() purchasedFrom?: string;
  @IsOptional() @IsDateString() purchasedTo?: string;
  @IsOptional() @IsString() @MaxLength(255) shop?: string;
  @Type(() => Number) @IsOptional() @IsInt() @Min(0) minPrice?: number;
  @Type(() => Number) @IsOptional() @IsInt() @Min(0) maxPrice?: number;
}
