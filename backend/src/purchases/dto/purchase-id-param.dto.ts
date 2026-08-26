import { IsUlid } from '../../common/validators/is-ulid.validator';
export class PurchaseIdParamDto {
  @IsUlid() id!: string;
}
