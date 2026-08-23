import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntryImage } from './entry-image.entity';
import { EntryTag } from './entry-tag.entity';
import { Entry } from './entry.entity';
import { Tag } from './tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, EntryImage, Tag, EntryTag])],
})
export class EntriesModule {}
