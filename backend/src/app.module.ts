import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntriesModule } from './entries/entries.module';
import { HealthController } from './health/health.controller';
import { SettingsModule } from './settings/settings.module';
import { PurchasesModule } from './purchases/purchases.module';
import { databaseOptions } from './database/database.options';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions),
    SettingsModule,
    EntriesModule,
    PurchasesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
