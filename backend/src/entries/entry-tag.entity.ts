import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Entry } from './entry.entity';
import { Tag } from './tag.entity';

@Entity('entry_tags')
@Unique(['entryId', 'tagId'])
export class EntryTag {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ name: 'entry_id', type: 'varchar', length: 26 })
  entryId!: string;

  @Column({ name: 'tag_id', type: 'varchar', length: 26 })
  tagId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Entry, (entry) => entry.entryTags)
  @JoinColumn({ name: 'entry_id' })
  entry!: Entry;

  @ManyToOne(() => Tag, (tag) => tag.entryTags)
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
