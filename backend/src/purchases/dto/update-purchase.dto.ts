import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { IsUlid } from '../../common/validators/is-ulid.validator';

export class UpdatePurchaseDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255) name?: string;
  @IsOptional() @IsUlid() purchaseCategoryId?: string;
  @IsOptional() @IsDateString() purchasedAt?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsString() @MaxLength(255) shop?: string | null;
  @IsOptional() @IsString() @MaxLength(10000) description?: string | null;
}
