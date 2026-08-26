import { IsUlid } from '../../common/validators/is-ulid.validator';

export class EntryPurchaseParamDto {
  @IsUlid()
  entryId!: string;

  @IsUlid()
  purchaseId!: string;
}
