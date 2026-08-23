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
  'happy',
  'calm',
  'sad',
  'angry',
  'anxious',
  'tired',
  'excited',
  'very_happy',
  'neutral',
  'very_sad',
] as const;

export const WEATHER_CONDITIONS = [
  'sunny',
  'cloudy',
  'rainy',
  'snowy',
  'sunny_cloudy',
  'sunny_rainy',
  'cloudy_rainy',
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
