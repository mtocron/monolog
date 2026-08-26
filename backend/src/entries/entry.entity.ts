import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntryImage } from './entry-image.entity';
import { EntryTag } from './entry-tag.entity';
import { EntryPurchase } from './entry-purchase.entity';

@Entity('entries')
export class Entry {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  emotion!: string | null;

  @Column({ type: 'varchar', nullable: true })
  weather!: string | null;

  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => EntryImage, (entryImage) => entryImage.entry)
  images!: EntryImage[];

  @OneToMany(() => EntryTag, (entryTag) => entryTag.entry)
  entryTags!: EntryTag[];

  @OneToMany(() => EntryPurchase, (entryPurchase) => entryPurchase.entry)
  entryPurchases!: EntryPurchase[];
}
