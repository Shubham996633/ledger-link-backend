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
import { Wallet } from './Wallet';

/**
 * WalletBalance Entity
 * Tracks fake/simulated balances for each wallet across different tokens
 * This allows users to practice with fake currency without real blockchain costs
 */
@Entity('wallet_balances')
@Index(['walletId', 'tokenSymbol'], { unique: true })
@Index(['walletId'])
export class WalletBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId: string;

  @Column({ type: 'varchar', default: 'ETH', name: 'token_symbol' })
  tokenSymbol: string; // 'ETH', 'USDT', 'USDC', 'DAI', etc.

  @Column({ type: 'varchar', nullable: true, name: 'token_address' })
  tokenAddress: string; // Contract address for ERC-20 tokens, null for native tokens

  @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
  balance: string; // Current balance

  @Column({ type: 'int', default: 18 })
  decimals: number; // Token decimals

  @Column({ type: 'varchar', nullable: true, name: 'token_name' })
  tokenName: string; // Full name of token (e.g., "Ethereum", "USD Tether")

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional token metadata

  // Relations
  @ManyToOne(() => Wallet, wallet => wallet.balances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
