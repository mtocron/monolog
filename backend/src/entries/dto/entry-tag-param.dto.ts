import { IsUlid } from '../../common/validators/is-ulid.validator';

export class EntryTagParamDto {
  @IsUlid()
  entryId!: string;

  @IsUlid()
  tagId!: string;
}
