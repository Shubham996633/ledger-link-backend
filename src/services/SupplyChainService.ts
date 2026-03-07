import { Repository, DataSource } from 'typeorm';
import { SupplyChainItem } from '@/entities/SupplyChainItem';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

/**
 * SupplyChainService - Blockchain-anchored supply chain tracking
 * Each item has a chain of custody with hash commitments on the blockchain.
 */
export class SupplyChainService {
  private itemRepository: Repository<SupplyChainItem>;

  constructor(private dataSource: DataSource) {
    this.itemRepository = dataSource.getRepository(SupplyChainItem);
  }

  private generateTrackingId(): string {
    const prefix = 'LL';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Register a new item in the supply chain
   */
  async createItem(params: {
    name: string;
    description?: string;
    ownerId: string;
    originLocation: string;
    metadata?: Record<string, any>;
  }): Promise<SupplyChainItem> {
    const trackingId = this.generateTrackingId();
    const dataStr = JSON.stringify({ ...params, trackingId, timestamp: Date.now() });
    const dataHash = crypto.createHash('sha256').update(dataStr).digest('hex');

    // Anchor to blockchain
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

    const item = this.itemRepository.create({
      trackingId,
      name: params.name,
      description: params.description,
      ownerId: params.ownerId,
      originLocation: params.originLocation,
      currentLocation: params.originLocation,
      status: 'created',
      chainOfCustody: [{
        fromUserId: 'system',
        toUserId: params.ownerId,
        location: params.originLocation,
        timestamp: new Date().toISOString(),
        txHash: dataHash,
        action: 'created',
      }],
      dataHash,
      blockHash,
      blockNumber,
      metadata: params.metadata,
    });

    const saved = await this.itemRepository.save(item);
    logger.info(`Supply chain item created: ${trackingId}`);
    return saved;
  }

  /**
   * Transfer item to a new owner (hand-off)
   */
  async transferItem(params: {
    trackingId: string;
    fromUserId: string;
    toUserId: string;
    location: string;
  }): Promise<SupplyChainItem | null> {
    const item = await this.itemRepository.findOneBy({ trackingId: params.trackingId });
    if (!item) return null;

    if (item.ownerId !== params.fromUserId) {
      logger.warn(`Transfer denied: ${params.fromUserId} is not the owner of ${params.trackingId}`);
      return null;
    }

    const transferData = JSON.stringify({ ...params, timestamp: Date.now() });
    const txHash = crypto.createHash('sha256').update(transferData).digest('hex');

    item.ownerId = params.toUserId;
    item.currentLocation = params.location;
    item.status = 'in_transit';
    item.chainOfCustody.push({
      fromUserId: params.fromUserId,
      toUserId: params.toUserId,
      location: params.location,
      timestamp: new Date().toISOString(),
      txHash,
      action: 'transfer',
    });

    // Update hash
    item.dataHash = crypto.createHash('sha256')
      .update(JSON.stringify(item.chainOfCustody))
      .digest('hex');

    const saved = await this.itemRepository.save(item);
    logger.info(`Item ${params.trackingId} transferred: ${params.fromUserId} -> ${params.toUserId}`);
    return saved;
  }

  /**
   * Update item status at a checkpoint
   */
  async updateCheckpoint(params: {
    trackingId: string;
    userId: string;
    location: string;
    status: string;
    temperature?: number;
    humidity?: number;
    notes?: string;
  }): Promise<SupplyChainItem | null> {
    const item = await this.itemRepository.findOneBy({ trackingId: params.trackingId });
    if (!item) return null;

    const checkpointData = JSON.stringify({ ...params, timestamp: Date.now() });
    const txHash = crypto.createHash('sha256').update(checkpointData).digest('hex');

    item.currentLocation = params.location;
    item.status = params.status;
    if (params.temperature !== undefined) item.temperature = params.temperature;
    if (params.humidity !== undefined) item.humidity = params.humidity;

    item.chainOfCustody.push({
      fromUserId: params.userId,
      toUserId: params.userId,
      location: params.location,
      timestamp: new Date().toISOString(),
      txHash,
      action: `checkpoint:${params.status}`,
    });

    item.dataHash = crypto.createHash('sha256')
      .update(JSON.stringify(item.chainOfCustody))
      .digest('hex');

    const saved = await this.itemRepository.save(item);
    logger.info(`Item ${params.trackingId} checkpoint: ${params.status} at ${params.location}`);
    return saved;
  }

  /**
   * Get item by tracking ID
   */
  async getItem(trackingId: string): Promise<SupplyChainItem | null> {
    return this.itemRepository.findOneBy({ trackingId });
  }

  /**
   * Get all items owned by a user
   */
  async getUserItems(ownerId: string): Promise<SupplyChainItem[]> {
    return this.itemRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Verify supply chain integrity for an item
   */
  async verifyIntegrity(trackingId: string): Promise<{ valid: boolean; chainLength: number; message: string }> {
    const item = await this.itemRepository.findOneBy({ trackingId });
    if (!item) return { valid: false, chainLength: 0, message: 'Item not found' };

    const currentHash = crypto.createHash('sha256')
      .update(JSON.stringify(item.chainOfCustody))
      .digest('hex');

    const valid = currentHash === item.dataHash;
    return {
      valid,
      chainLength: item.chainOfCustody.length,
      message: valid ? 'Supply chain integrity verified' : 'Chain of custody may have been tampered with',
    };
  }

  /**
   * Get supply chain statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const total = await this.itemRepository.count();
    const statusCounts = await this.itemRepository
      .createQueryBuilder('item')
      .select('item.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('item.status')
      .getRawMany();

    return { totalItems: total, byStatus: statusCounts };
  }
}
