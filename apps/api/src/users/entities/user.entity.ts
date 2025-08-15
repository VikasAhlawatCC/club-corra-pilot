import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { PaymentDetails } from './payment-details.entity';
import { AuthProvider } from './auth-provider.entity';
import { CoinBalance } from '../../coins/entities/coin-balance.entity';
import { CoinTransaction } from '../../coins/entities/coin-transaction.entity';
import { File } from '../../files/file.entity';
import { Notification } from '../../notifications/notification.entity';

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  mobileNumber: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ default: false })
  isMobileVerified: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  hasWelcomeBonusProcessed: boolean;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true })
  refreshTokenHash: string;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpiresAt: Date;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column('simple-array', { default: 'USER' })
  roles: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  @JoinColumn()
  profile: UserProfile;

  @OneToOne(() => PaymentDetails, (payment) => payment.user, { cascade: true })
  @JoinColumn()
  paymentDetails: PaymentDetails;

  @OneToMany(() => AuthProvider, (provider) => provider.user, { cascade: true })
  authProviders: AuthProvider[];

  @OneToOne(() => CoinBalance, (coinBalance) => coinBalance.user, { cascade: true })
  coinBalance: CoinBalance;

  @OneToMany(() => CoinTransaction, (transaction) => transaction.user)
  coinTransactions: CoinTransaction[];

  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
