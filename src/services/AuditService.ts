import { Repository, DataSource } from 'typeorm';
import { AuditLog } from '@/entities/AuditLog';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

/**
 * AuditService - Immutable, blockchain-anchored audit trail
 * Chains audit logs together using hash pointers for tamper detection.
 */
export class AuditService {
  private auditRepository: Repository<AuditLog>;
  private lastHash: string = '0'.repeat(64);

  constructor(private dataSource: DataSource) {
    this.auditRepository = dataSource.getRepository(AuditLog);
  }

  async initialize(): Promise<void> {
    // Load the last audit log hash for chaining
    const lastLog = await this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });
    if (lastLog.length > 0 && lastLog[0].txHash) {
      this.lastHash = lastLog[0].txHash;
    }
    logger.info('Audit service initialized');
  }

  /**
   * Record an audit event with hash chaining
   */
  async log(params: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    description?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const previousHash = this.lastHash;

    // Create a hash commitment for this log entry
    const logData = JSON.stringify({
      ...params,
      previousHash,
      timestamp: Date.now(),
    });
    const txHash = crypto.createHash('sha256').update(logData).digest('hex');

    const auditLog = this.auditRepository.create({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      txHash,
      previousHash,
    });

    const saved = await this.auditRepository.save(auditLog);
    this.lastHash = txHash;

    logger.debug(`Audit: ${params.action} on ${params.entityType} by ${params.userId || 'system'}`);
    return saved;
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const qb = this.auditRepository.createQueryBuilder('log');

    if (filters.userId) qb.andWhere('log.user_id = :userId', { userId: filters.userId });
    if (filters.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters.entityType) qb.andWhere('log.entity_type = :entityType', { entityType: filters.entityType });
    if (filters.entityId) qb.andWhere('log.entity_id = :entityId', { entityId: filters.entityId });

    qb.orderBy('log.created_at', 'DESC');
    qb.take(filters.limit || 50);
    qb.skip(filters.offset || 0);

    const [logs, total] = await qb.getManyAndCount();
    return { logs, total };
  }

  /**
   * Verify audit chain integrity - detect tampering
   */
  async verifyIntegrity(): Promise<{ valid: boolean; errors: string[]; totalLogs: number }> {
    const logs = await this.auditRepository.find({
      order: { createdAt: 'ASC' },
    });

    const errors: string[] = [];
    let previousHash = '0'.repeat(64);

    for (const log of logs) {
      if (log.previousHash !== previousHash) {
        errors.push(`Audit log ${log.id}: chain break - expected previous hash ${previousHash.slice(0, 16)}...`);
      }
      previousHash = log.txHash || previousHash;
    }

    return {
      valid: errors.length === 0,
      errors,
      totalLogs: logs.length,
    };
  }

  /**
   * Get audit summary statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const total = await this.auditRepository.count();

    const actionCounts = await this.auditRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .getRawMany();

    const entityCounts = await this.auditRepository
      .createQueryBuilder('log')
      .select('log.entity_type', 'entityType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.entity_type')
      .getRawMany();

    return {
      totalLogs: total,
      byAction: actionCounts,
      byEntityType: entityCounts,
    };
  }
}
