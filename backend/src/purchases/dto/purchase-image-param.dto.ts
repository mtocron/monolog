import { IsUlid } from '../../common/validators/is-ulid.validator';
export class PurchaseImageParamDto {
  @IsUlid() purchaseId!: string;
  @IsUlid() imageId!: string;
}
