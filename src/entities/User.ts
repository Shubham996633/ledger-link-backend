import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Transaction } from './Transaction';
import { Wallet } from './Wallet';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  username: string;

  @Column({ type: 'varchar', nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', default: 'user' })
  role: string; // 'user', 'admin', 'provider', 'patient', 'auditor'

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @Column({ type: 'varchar', nullable: true, name: 'profile_image_url' })
  profileImageUrl: string;

  @Column({ type: 'varchar', nullable: true, name: 'password_hash' })
  passwordHash: string; // For email/password authentication

  @Column({ type: 'varchar', nullable: true, name: 'password_reset_token' })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true, name: 'password_reset_expires' })
  passwordResetExpires: Date;

  @Column({ type: 'varchar', nullable: true, name: 'email_verification_token' })
  emailVerificationToken: string;

  // Relations
  @OneToMany(() => Wallet, wallet => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, transaction => transaction.user)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // TODO: Add password field for traditional auth (if needed)
  // TODO: Add 2FA fields
  // TODO: Add user preferences
  // TODO: Add audit trail fields
}
