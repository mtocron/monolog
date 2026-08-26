import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryImage } from './entry-image.entity';
import { EntryTag } from './entry-tag.entity';
import { EntryPurchase } from './entry-purchase.entity';
import { Entry } from './entry.entity';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { SettingsModule } from '../settings/settings.module';
import { Tag } from './tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entry, EntryImage, Tag, EntryTag, EntryPurchase]),
    SettingsModule,
  ],
  controllers: [EntriesController],
  providers: [EntriesService],
})
export class EntriesModule {}
