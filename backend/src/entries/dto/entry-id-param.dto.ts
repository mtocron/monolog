import { IsUlid } from '../../common/validators/is-ulid.validator';

export class EntryIdParamDto {
  @IsUlid()
  id!: string;
}
