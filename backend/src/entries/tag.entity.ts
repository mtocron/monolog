import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryTag } from './entry-tag.entity';

@Entity('tags')
export class Tag {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => EntryTag, (entryTag) => entryTag.tag)
  entryTags!: EntryTag[];
}
