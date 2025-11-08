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
@Index(['isSimulated'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  hash: string; // Blockchain transaction hash (or simulated hash for fake transactions)

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', name: 'from_address' })
  fromAddress: string;

  @Column({ type: 'varchar', name: 'to_address' })
  toAddress: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string; // Amount in wei (supports very large numbers)

  @Column({ type: 'varchar', nullable: true, name: 'token_address' })
  tokenAddress: string; // For ERC-20 tokens, null for ETH

  @Column({ type: 'varchar', default: 'ETH', name: 'token_symbol' })
  tokenSymbol: string; // Token symbol (ETH, USDT, USDC, etc.)

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';

  @Column({ type: 'boolean', default: true, name: 'is_simulated' })
  isSimulated: boolean; // True for fake/practice transactions, false for real blockchain

  @Column({ type: 'int', nullable: true, name: 'block_number' })
  blockNumber: number; // Null for simulated transactions

  @Column({ type: 'int', nullable: true })
  confirmations: number;

  @Column({ type: 'decimal', precision: 36, scale: 18, name: 'gas_used' })
  gasUsed: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, name: 'gas_price' })
  gasPrice: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, name: 'transaction_fee' })
  transactionFee: string;

  @Column({ type: 'text', nullable: true })
  data: string; // Transaction data/input

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional transaction metadata

  @Column({ type: 'text', nullable: true })
  description: string; // User-defined description

  @Column({ type: 'varchar', default: 'ethereum' })
  blockchain: string;

  @Column({ type: 'varchar', default: 'goerli' })
  network: string;

  // Relations
  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // TODO: Add transaction categorization
  // TODO: Add transaction tags
  // TODO: Add transaction receipts
  // TODO: Add transaction events/logs
  // TODO: Add transaction risk scoring
}
