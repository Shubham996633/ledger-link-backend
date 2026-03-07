import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('blocks')
@Index(['blockNumber'], { unique: true })
@Index(['hash'], { unique: true })
@Index(['createdAt'])
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unique: true, name: 'block_number' })
  blockNumber: number;

  @Column({ type: 'varchar', unique: true })
  hash: string;

  @Column({ type: 'varchar', name: 'previous_hash' })
  previousHash: string;

  @Column({ type: 'varchar', name: 'merkle_root' })
  merkleRoot: string;

  @Column({ type: 'bigint' })
  nonce: string;

  @Column({ type: 'int', default: 2 })
  difficulty: number;

  @Column({ type: 'bigint' })
  timestamp: string;

  @Column({ type: 'varchar', name: 'miner_address' })
  minerAddress: string;

  @Column({ type: 'int', name: 'transaction_count', default: 0 })
  transactionCount: number;

  @Column({ type: 'jsonb', name: 'transaction_hashes', default: [] })
  transactionHashes: string[];

  @Column({ type: 'decimal', precision: 36, scale: 18, name: 'total_gas_used', default: '0' })
  totalGasUsed: string;

  @Column({ type: 'decimal', precision: 36, scale: 18, name: 'block_reward', default: '2.0' })
  blockReward: string;

  @Column({ type: 'int', name: 'size_bytes', default: 0 })
  sizeBytes: number;

  @Column({ type: 'varchar', name: 'state_root', nullable: true })
  stateRoot: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
