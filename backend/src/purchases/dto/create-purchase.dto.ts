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

export class CreatePurchaseDto {
  @IsString() @IsNotEmpty() @MaxLength(255) name!: string;
  @IsUlid() purchaseCategoryId!: string;
  @IsDateString() purchasedAt!: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsString() @MaxLength(255) shop?: string | null;
  @IsOptional() @IsString() @MaxLength(10000) description?: string | null;
}
