import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BrandCategory } from './brand-category.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string;

  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2, 
    default: 10,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 10 : parsed;
        }
        return value || 10;
      }
    }
  })
  earningPercentage: number; // Percentage of MRP earned as coins (default: 10%)

  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2, 
    default: 30,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 30 : parsed;
        }
        return value || 30;
      }
    }
  })
  redemptionPercentage: number; // Percentage of MRP that can be redeemed (default: 30%)

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    default: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 1 : parsed;
        }
        return value || 1;
      }
    }
  })
  minRedemptionAmount: number; // Minimum amount required for redemption (default: 1)

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    default: 2000,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 2000 : parsed;
        }
        return value || 2000;
      }
    }
  })
  maxRedemptionAmount: number; // Maximum amount that can be redeemed (default: 2000, same as brandwiseMaxCap)

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    default: 2000,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 2000 : parsed;
        }
        return value || 2000;
      }
    }
  })
  brandwiseMaxCap: number; // Per-transaction maximum redemption limit (default: 2000, same as maxRedemptionAmount)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => BrandCategory, (category) => category.brands)
  @JoinColumn({ name: 'categoryId' })
  category: BrandCategory;

  @OneToMany(() => CoinTransaction, (transaction) => transaction.brand)
  transactions: CoinTransaction[];

  @BeforeInsert()
  @BeforeUpdate()
  validateBusinessRules() {
    // Validate redemption amount constraints
    if (this.minRedemptionAmount > 0 && this.maxRedemptionAmount > 0) {
      if (this.maxRedemptionAmount < this.minRedemptionAmount) {
        throw new Error('Maximum redemption amount cannot be less than minimum redemption amount');
      }
    }
    
    // Validate percentage constraints with better error messages
    if (this.earningPercentage < 0 || this.earningPercentage > 100) {
      throw new Error('Earning percentage must be between 0 and 100');
    }
    
    if (this.redemptionPercentage < 0 || this.redemptionPercentage > 100) {
      throw new Error('Redemption percentage must be between 0 and 100');
    }
    
    // Note: Removed the strict combined percentage rule as it may be too restrictive
    // for some business models. This can be enforced at the application level if needed.
    
    // Validate cap constraints
    if (this.brandwiseMaxCap < 0) {
      throw new Error('Brandwise max cap cannot be negative');
    }

    // Ensure maxRedemptionAmount and brandwiseMaxCap are consistent
    if (this.maxRedemptionAmount !== this.brandwiseMaxCap) {
      this.maxRedemptionAmount = this.brandwiseMaxCap;
    }
  }
}
