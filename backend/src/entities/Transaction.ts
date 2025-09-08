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

@Entity('transactions')
@Index(['hash'], { unique: true })
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  hash: string; // Blockchain transaction hash

  @Column()
  userId: string;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string; // Amount in wei (supports very large numbers)

  @Column({ nullable: true })
  tokenAddress: string; // For ERC-20 tokens, null for ETH

  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';

  @Column({ type: 'int' })
  blockNumber: number;

  @Column({ type: 'int', nullable: true })
  confirmations: number;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  gasUsed: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  gasPrice: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  transactionFee: string;

  @Column({ nullable: true })
  data: string; // Transaction data/input

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional transaction metadata

  @Column({ nullable: true })
  description: string; // User-defined description

  @Column({ default: 'ethereum' })
  blockchain: string;

  @Column({ default: 'goerli' })
  network: string;

  // Relations
  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Add transaction categorization
  // TODO: Add transaction tags
  // TODO: Add transaction receipts
  // TODO: Add transaction events/logs
  // TODO: Add transaction risk scoring
}
