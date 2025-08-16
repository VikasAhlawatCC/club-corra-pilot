import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('coin_transactions')
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  brandId: string;

  @Column({ 
    type: 'enum', 
    enum: ['EARN', 'REDEEM', 'WELCOME_BONUS', 'ADJUSTMENT'] 
  })
  type: 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT';

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return value || 0;
      }
    }
  })
  amount: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return value || 0;
      }
    }
  })
  billAmount: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return value || 0;
      }
    }
  })
  coinsEarned: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => {
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return value || 0;
      }
    }
  })
  coinsRedeemed: number;

  @Column({ 
    type: 'enum', 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'PAID'],
    default: 'PENDING'
  })
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID';

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId: string; // Admin payment tracking ID

  @Column({ type: 'date', nullable: true })
  billDate: Date; // Receipt date for validation

  @Column({ type: 'timestamp', nullable: true })
  paymentProcessedAt: Date; // Payment completion timestamp

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.coinTransactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Brand, (brand) => brand.transactions, { nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @BeforeInsert()
  @BeforeUpdate()
  validateTransactionAmount() {
    // Ensure amount is not zero
    if (this.amount === 0) {
      throw new Error('Transaction amount cannot be zero');
    }

    // Validate amount based on transaction type
    switch (this.type) {
      case 'WELCOME_BONUS':
      case 'EARN':
        if (this.amount <= 0) {
          throw new Error('Credit transactions (WELCOME_BONUS, EARN) must have positive amounts');
        }
        break;
      case 'REDEEM':
        if (this.amount <= 0) {
          throw new Error('Debit transactions (REDEEM) must have positive amounts');
        }
        break;
      case 'ADJUSTMENT':
        // Adjustments can be positive or negative
        break;
    }
  }
}
