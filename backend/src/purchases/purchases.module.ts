import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { PurchaseCategory } from './purchase-category.entity';
import { PurchaseImage } from './purchase-image.entity';
import { Purchase } from './purchase.entity';
import { EntryPurchase } from '../entries/entry-purchase.entity';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Purchase,
      PurchaseCategory,
      PurchaseImage,
      EntryPurchase,
    ]),
    SettingsModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
