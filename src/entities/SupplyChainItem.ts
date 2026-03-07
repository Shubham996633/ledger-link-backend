import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('supply_chain_items')
@Index(['trackingId'], { unique: true })
@Index(['ownerId'])
@Index(['status'])
@Index(['createdAt'])
export class SupplyChainItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, name: 'tracking_id' })
  trackingId: string; // Unique tracking code

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string; // Current owner user ID

  @Column({ type: 'varchar', name: 'origin_location' })
  originLocation: string;

  @Column({ type: 'varchar', name: 'current_location' })
  currentLocation: string;

  @Column({ type: 'varchar', default: 'created' })
  status: string; // 'created', 'in_transit', 'at_checkpoint', 'delivered', 'recalled'

  @Column({ type: 'jsonb', name: 'chain_of_custody', default: '[]' })
  chainOfCustody: {
    fromUserId: string;
    toUserId: string;
    location: string;
    timestamp: string;
    txHash: string;
    action: string;
  }[];

  @Column({ type: 'varchar', name: 'data_hash' })
  dataHash: string; // Hash commitment on blockchain

  @Column({ type: 'varchar', name: 'block_hash', nullable: true })
  blockHash: string;

  @Column({ type: 'int', name: 'block_number', nullable: true })
  blockNumber: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  temperature: number; // For cold-chain tracking

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  humidity: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
