import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar' })
  action: string; // 'create', 'read', 'update', 'delete', 'transfer', 'verify', 'login', 'logout'

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType: string; // 'transaction', 'wallet', 'block', 'health_record', 'supply_chain', etc.

  @Column({ type: 'varchar', name: 'entity_id', nullable: true })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', name: 'tx_hash', nullable: true })
  txHash: string; // On-chain hash commitment for tamper-proofing

  @Column({ type: 'varchar', name: 'previous_hash', nullable: true })
  previousHash: string; // Chain audit logs together

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
