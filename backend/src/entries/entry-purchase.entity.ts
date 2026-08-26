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
import { Purchase } from '../purchases/purchase.entity';
import { Entry } from './entry.entity';

@Entity('entry_purchases')
@Unique(['entryId', 'purchaseId'])
export class EntryPurchase {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ name: 'entry_id', type: 'varchar', length: 26 })
  entryId!: string;

  @Column({ name: 'purchase_id', type: 'varchar', length: 26 })
  purchaseId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Entry, (entry) => entry.entryPurchases)
  @JoinColumn({ name: 'entry_id' })
  entry!: Entry;

  @ManyToOne(() => Purchase, (purchase) => purchase.entryPurchases)
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;
}
