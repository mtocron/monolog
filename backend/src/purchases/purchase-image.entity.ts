import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Purchase } from './purchase.entity';

@Entity('purchase_images')
export class PurchaseImage {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id!: string;
  @Column({ name: 'purchase_id', type: 'varchar', length: 26 })
  purchaseId!: string;
  @Column({ name: 'file_path', type: 'text' }) filePath!: string;
  @Column({ name: 'original_file_name', type: 'text' })
  originalFileName!: string;
  @Column({ name: 'sort_order', type: 'integer' }) sortOrder!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @ManyToOne(() => Purchase, (purchase) => purchase.images)
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;
}
