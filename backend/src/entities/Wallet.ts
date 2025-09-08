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

@Entity('wallets')
@Index(['address'], { unique: true })
@Index(['userId'])
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  address: string; // Ethereum wallet address

  @Column()
  userId: string;

  @Column({ default: 'ethereum' })
  blockchain: string; // 'ethereum', 'arbitrum', etc.

  @Column({ default: 'goerli' })
  network: string; // 'mainnet', 'goerli', 'arbitrum-goerli', etc.

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPrimary: boolean; // Primary wallet for the user

  @Column({ nullable: true })
  label: string; // User-defined label for the wallet

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional wallet metadata

  @Column({ nullable: true })
  lastUsedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.wallets)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Add wallet verification status
  // TODO: Add wallet balance tracking
  // TODO: Add wallet activity metrics
  // TODO: Add multi-signature wallet support
}
