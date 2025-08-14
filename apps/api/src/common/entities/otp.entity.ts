import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OTPType {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export enum OTPStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED',
}

@Entity('otps')
@Index(['identifier', 'type', 'status'])
export class OTP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  identifier: string; // mobile number or email

  @Column({ type: 'enum', enum: OTPType })
  type: OTPType;

  @Column()
  code: string; // hashed OTP code

  @Column({ type: 'enum', enum: OTPStatus, default: OTPStatus.PENDING })
  status: OTPStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
