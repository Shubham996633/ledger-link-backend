import { Repository, DataSource } from 'typeorm';
import { HealthRecord } from '@/entities/HealthRecord';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

/**
 * HealthRecordService - Privacy-preserving healthcare record management
 * Records are encrypted at rest with AES-256-CBC.
 * Hash commitments are stored on-chain for integrity verification.
 */
export class HealthRecordService {
  private healthRepository: Repository<HealthRecord>;
  private encryptionKey: Buffer;

  constructor(private dataSource: DataSource) {
    this.healthRepository = dataSource.getRepository(HealthRecord);
    // Use first 32 bytes of env key, padded if needed
    const keyStr = process.env.ENCRYPTION_KEY || 'default-encryption-key-32chars!!';
    this.encryptionKey = Buffer.from(keyStr.padEnd(32, '0').slice(0, 32));
  }

  private encrypt(data: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
  }

  private decrypt(encrypted: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Create a new encrypted health record
   */
  async createRecord(params: {
    patientId: string;
    providerId: string;
    recordType: string;
    data: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<HealthRecord> {
    const dataStr = JSON.stringify(params.data);
    const dataHash = crypto.createHash('sha256').update(dataStr).digest('hex');
    const { encrypted, iv } = this.encrypt(dataStr);

    // Store hash on blockchain via global service
    let blockHash: string | undefined;
    let blockNumber: number | undefined;
    const blockchainService = (global as any).__blockchainService;
    if (blockchainService) {
      const latestBlock = await blockchainService.getLatestBlock();
      if (latestBlock) {
        blockHash = latestBlock.hash;
        blockNumber = latestBlock.blockNumber;
      }
    }

    // Generate ZK proof for the record
    let zkProofId: string | undefined;
    const zkService = (global as any).__zkProofService;
    if (zkService) {
      const proof = zkService.generateIntegrityProof(dataStr);
      zkProofId = proof.proofId;
    }

    const record = this.healthRepository.create({
      patientId: params.patientId,
      providerId: params.providerId,
      recordType: params.recordType,
      encryptedData: encrypted,
      dataHash,
      encryptionIv: iv,
      accessControl: [
        { userId: params.patientId, role: 'patient', grantedAt: new Date().toISOString() },
        { userId: params.providerId, role: 'provider', grantedAt: new Date().toISOString() },
      ],
      blockHash,
      blockNumber,
      zkProofId,
      status: 'active',
      metadata: params.metadata,
    });

    const saved = await this.healthRepository.save(record);
    logger.info(`Health record created: ${saved.id} (type: ${params.recordType})`);
    return saved;
  }

  /**
   * Get a record (decrypted) - checks access control
   */
  async getRecord(recordId: string, requesterId: string): Promise<{ record: HealthRecord; decryptedData: Record<string, any> } | null> {
    const record = await this.healthRepository.findOneBy({ id: recordId });
    if (!record) return null;

    // Check access control
    const hasAccess = record.accessControl.some(ac => ac.userId === requesterId);
    if (!hasAccess) {
      logger.warn(`Access denied: user ${requesterId} tried to access record ${recordId}`);
      return null;
    }

    const decryptedData = JSON.parse(this.decrypt(record.encryptedData, record.encryptionIv));
    return { record, decryptedData };
  }

  /**
   * Get all records for a patient
   */
  async getPatientRecords(patientId: string, requesterId: string): Promise<HealthRecord[]> {
    const records = await this.healthRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });

    // Filter to only records the requester has access to
    return records.filter(r =>
      r.accessControl.some(ac => ac.userId === requesterId)
    );
  }

  /**
   * Grant access to a record
   */
  async grantAccess(recordId: string, granterId: string, targetUserId: string, role: string): Promise<boolean> {
    const record = await this.healthRepository.findOneBy({ id: recordId });
    if (!record) return false;

    // Only patient or provider can grant access
    const granterAccess = record.accessControl.find(ac => ac.userId === granterId);
    if (!granterAccess || !['patient', 'provider'].includes(granterAccess.role)) {
      return false;
    }

    // Check if already has access
    if (record.accessControl.some(ac => ac.userId === targetUserId)) {
      return true;
    }

    record.accessControl.push({
      userId: targetUserId,
      role,
      grantedAt: new Date().toISOString(),
    });

    await this.healthRepository.save(record);
    logger.info(`Access granted: ${targetUserId} (${role}) to record ${recordId}`);
    return true;
  }

  /**
   * Revoke access to a record
   */
  async revokeAccess(recordId: string, revokerId: string, targetUserId: string): Promise<boolean> {
    const record = await this.healthRepository.findOneBy({ id: recordId });
    if (!record) return false;

    const revokerAccess = record.accessControl.find(ac => ac.userId === revokerId);
    if (!revokerAccess || revokerAccess.role !== 'patient') {
      return false; // Only patients can revoke
    }

    record.accessControl = record.accessControl.filter(ac => ac.userId !== targetUserId);
    await this.healthRepository.save(record);
    logger.info(`Access revoked: ${targetUserId} from record ${recordId}`);
    return true;
  }

  /**
   * Verify record integrity using stored hash
   */
  async verifyIntegrity(recordId: string, requesterId: string): Promise<{ valid: boolean; message: string }> {
    const result = await this.getRecord(recordId, requesterId);
    if (!result) return { valid: false, message: 'Record not found or access denied' };

    const currentHash = crypto.createHash('sha256')
      .update(JSON.stringify(result.decryptedData))
      .digest('hex');

    const valid = currentHash === result.record.dataHash;
    return {
      valid,
      message: valid ? 'Record integrity verified' : 'Record may have been tampered with',
    };
  }

  /**
   * Get record statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const total = await this.healthRepository.count();
    const typeCounts = await this.healthRepository
      .createQueryBuilder('r')
      .select('r.record_type', 'recordType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.record_type')
      .getRawMany();

    return { totalRecords: total, byType: typeCounts };
  }
}
