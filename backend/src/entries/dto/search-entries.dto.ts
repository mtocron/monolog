import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EMOTIONS } from './create-entry.dto';

export class SearchEntriesDto {
  @IsOptional() @IsString() @MaxLength(10000) content?: string;
  @IsOptional() @IsString() @MaxLength(100) tag?: string;
  @IsOptional() @IsDateString() recordedFrom?: string;
  @IsOptional() @IsDateString() recordedTo?: string;
  @IsOptional() @IsIn(EMOTIONS) emotion?: (typeof EMOTIONS)[number];
  @IsOptional() @IsString() @MaxLength(255) location?: string;
}
