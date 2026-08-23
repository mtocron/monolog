import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const EMOTIONS = [
  'very_happy',
  'happy',
  'neutral',
  'sad',
  'very_sad',
  'angry',
  'anxious',
  'tired',
  'excited',
] as const;

export const WEATHER_CONDITIONS = [
  'sunny',
  'cloudy',
  'rainy',
  'snowy',
] as const;

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;

  @Type(() => Date)
  @IsDate()
  recordedAt!: Date;

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
