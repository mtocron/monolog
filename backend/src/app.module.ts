import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health/health.controller';
import { SettingsModule } from './settings/settings.module';
import { databaseOptions } from './database/database.options';

@Module({
  imports: [TypeOrmModule.forRoot(databaseOptions), SettingsModule],
  controllers: [HealthController],
})
export class AppModule {}
