import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[^#]+$/)
  name!: string;
}
