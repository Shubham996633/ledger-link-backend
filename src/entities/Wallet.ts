import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { WalletBalance } from './WalletBalance';

@Entity('wallets')
@Index(['address'], { unique: true })
@Index(['userId'])
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  address: string; // Ethereum wallet address

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', default: 'ethereum' })
  blockchain: string; // 'ethereum', 'arbitrum', etc.

  @Column({ type: 'varchar', default: 'goerli' })
  network: string; // 'mainnet', 'goerli', 'arbitrum-goerli', etc.

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary: boolean; // Primary wallet for the user

  @Column({ type: 'varchar', nullable: true })
  label: string; // User-defined label for the wallet

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional wallet metadata

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date;

  @Column({ type: 'boolean', default: true, name: 'is_simulated' })
  isSimulated: boolean; // True for fake/practice wallets, false for real blockchain wallets

  // Relations
  @ManyToOne(() => User, user => user.wallets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => WalletBalance, balance => balance.wallet)
  balances: WalletBalance[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // TODO: Add wallet verification status
  // TODO: Add wallet balance tracking
  // TODO: Add wallet activity metrics
  // TODO: Add multi-signature wallet support
}
