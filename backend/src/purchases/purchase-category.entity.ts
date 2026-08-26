import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Purchase } from './purchase.entity';

@Entity('purchase_categories')
export class PurchaseCategory {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id!: string;
  @Column({ type: 'varchar', unique: true }) name!: string;
  @Column({ name: 'sort_order', type: 'integer' }) sortOrder!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
  @OneToMany(() => Purchase, (purchase) => purchase.purchaseCategory)
  purchases!: Purchase[];
}
