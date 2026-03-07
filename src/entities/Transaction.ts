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

  @Column({ type: 'varchar', length: 255, unique: true })
  hash: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255, name: 'from_address' })
  fromAddress: string;

  @Column({ type: 'varchar', length: 255, name: 'to_address' })
  toAddress: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'token_address' })
  tokenAddress: string;

  @Column({ type: 'varchar', length: 20, default: 'ETH', name: 'token_symbol' })
  tokenSymbol: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';

  @Column({ type: 'boolean', default: true, name: 'is_simulated' })
  isSimulated: boolean;

  @Column({ type: 'int', nullable: true, name: 'block_number' })
  blockNumber: number;

  @Column({ type: 'int', nullable: true })
  confirmations: number;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true, name: 'gas_used' })
  gasUsed: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true, name: 'gas_price' })
  gasPrice: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, nullable: true, name: 'transaction_fee' })
  transactionFee: string;

  @Column({ type: 'text', nullable: true })
  data: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'ethereum' })
  blockchain: string;

  @Column({ type: 'varchar', length: 50, default: 'goerli' })
  network: string;

  // Relations
  @ManyToOne(() => User, user => user.transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
