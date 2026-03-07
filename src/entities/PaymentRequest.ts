import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Wallet } from './Wallet';

@Entity('payment_requests')
export class PaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId: string;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ type: 'varchar', name: 'wallet_address' })
  walletAddress: string;

  @Column({ type: 'varchar', unique: true, name: 'request_id' })
  requestId: string; // Short unique ID for sharing

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  amount: string; // If null, sender can choose amount

  @Column({ type: 'varchar', default: 'ETH', name: 'token_symbol' })
  tokenSymbol: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'cancelled', 'expired'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'cancelled' | 'expired';

  @Column({ type: 'uuid', nullable: true, name: 'paid_by_user_id' })
  paidByUserId: string;

  @Column({ type: 'uuid', nullable: true, name: 'transaction_id' })
  transactionId: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
