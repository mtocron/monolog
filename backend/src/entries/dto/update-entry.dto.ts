import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EMOTIONS, WEATHER_CONDITIONS } from './create-entry.dto';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  recordedAt?: Date;

  @IsOptional()
  @IsIn(EMOTIONS)
  emotion?: (typeof EMOTIONS)[number] | null;

  @IsOptional()
  @IsIn(WEATHER_CONDITIONS)
  weather?: (typeof WEATHER_CONDITIONS)[number] | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;
}
