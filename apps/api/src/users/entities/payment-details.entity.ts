import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('payment_details')
export class PaymentDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  upiId: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  mobileNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.paymentDetails)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;
}
