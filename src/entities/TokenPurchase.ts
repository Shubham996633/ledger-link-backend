import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('token_purchases')
@Index(['userId'])
@Index(['stripeSessionId'], { unique: true })
@Index(['status'])
export class TokenPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'wallet_id' })
  walletId: string;

  @Column({ type: 'varchar', length: 255, name: 'stripe_session_id', unique: true })
  stripeSessionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stripe_payment_intent' })
  stripePaymentIntent: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'usd_amount' })
  usdAmount: string;

  @Column({ type: 'varchar', length: 20, name: 'token_symbol' })
  tokenSymbol: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, name: 'token_amount' })
  tokenAmount: string;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'price_at_purchase' })
  priceAtPurchase: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'completed' | 'failed' | 'expired' | 'cancelled';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
