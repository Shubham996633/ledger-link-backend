import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('health_records')
@Index(['patientId'])
@Index(['providerId'])
@Index(['recordType'])
@Index(['createdAt'])
export class HealthRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'patient_id' })
  patientId: string; // user ID of the patient

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string; // user ID of the healthcare provider

  @Column({ type: 'varchar', name: 'record_type' })
  recordType: string; // 'diagnosis', 'prescription', 'lab_result', 'imaging', 'procedure', 'visit_note'

  @Column({ type: 'text', name: 'encrypted_data' })
  encryptedData: string; // AES-encrypted record content

  @Column({ type: 'varchar', name: 'data_hash' })
  dataHash: string; // SHA-256 hash of original data for integrity verification

  @Column({ type: 'varchar', name: 'encryption_iv' })
  encryptionIv: string; // Initialization vector for AES

  @Column({ type: 'jsonb', name: 'access_control', default: '[]' })
  accessControl: { userId: string; role: string; grantedAt: string }[];

  @Column({ type: 'varchar', name: 'block_hash', nullable: true })
  blockHash: string; // Block where this record's hash was committed

  @Column({ type: 'int', name: 'block_number', nullable: true })
  blockNumber: number;

  @Column({ type: 'varchar', name: 'zk_proof_id', nullable: true })
  zkProofId: string; // Associated ZK proof for privacy-preserving verification

  @Column({ type: 'varchar', default: 'active' })
  status: string; // 'active', 'archived', 'revoked'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
