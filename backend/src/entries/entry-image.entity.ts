import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Entry } from './entry.entity';

@Entity('entry_images')
export class EntryImage {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ name: 'entry_id', type: 'varchar', length: 26 })
  entryId!: string;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;

  @Column({ name: 'original_file_name', type: 'text' })
  originalFileName!: string;

  @Column({ name: 'sort_order', type: 'integer' })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Entry, (entry) => entry.images)
  @JoinColumn({ name: 'entry_id' })
  entry!: Entry;
}
