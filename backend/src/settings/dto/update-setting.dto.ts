import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  value!: string;
}

export class UpdateThemeSettingDto extends UpdateSettingDto {
  @IsIn(['light', 'dark', 'capture'])
  declare value: 'light' | 'dark' | 'capture';
}
