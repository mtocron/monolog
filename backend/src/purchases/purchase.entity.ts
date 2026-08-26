import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PurchaseCategory } from './purchase-category.entity';
import { PurchaseImage } from './purchase-image.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryColumn({ type: 'varchar', length: 26 }) id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ name: 'purchase_category_id', type: 'varchar', length: 26 })
  purchaseCategoryId!: string;
  @Column({ name: 'purchased_at', type: 'date' }) purchasedAt!: string;
  @Column({ type: 'integer' }) price!: number;
  @Column({ type: 'varchar', nullable: true }) shop!: string | null;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
  @ManyToOne(() => PurchaseCategory, (category) => category.purchases)
  @JoinColumn({ name: 'purchase_category_id' })
  purchaseCategory!: PurchaseCategory;
  @OneToMany(() => PurchaseImage, (image) => image.purchase)
  images!: PurchaseImage[];
}
