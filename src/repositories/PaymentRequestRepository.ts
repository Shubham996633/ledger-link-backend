import { Repository, DataSource } from 'typeorm';
import { PaymentRequest } from '@/entities/PaymentRequest';

export class PaymentRequestRepository {
  private repository: Repository<PaymentRequest>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(PaymentRequest);
  }

  async findById(id: string): Promise<PaymentRequest | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByRequestId(requestId: string): Promise<PaymentRequest | null> {
    return this.repository.findOne({
      where: { requestId },
      relations: ['wallet', 'user']
    });
  }

  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<PaymentRequest[]> {
    return this.repository.find({
      where: { userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: ['wallet']
    });
  }

  async findByWalletId(walletId: string, limit: number = 20, offset: number = 0): Promise<PaymentRequest[]> {
    return this.repository.find({
      where: { walletId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async create(requestData: Partial<PaymentRequest>): Promise<PaymentRequest> {
    const request = this.repository.create(requestData);
    return this.repository.save(request);
  }

  async update(id: string, requestData: Partial<PaymentRequest>): Promise<PaymentRequest | null> {
    await this.repository.update(id, requestData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async markAsCompleted(requestId: string, transactionId: string, paidByUserId: string): Promise<PaymentRequest | null> {
    await this.repository.update(
      { requestId },
      {
        status: 'completed',
        transactionId,
        paidByUserId
      }
    );
    return this.findByRequestId(requestId);
  }

  async expireOldRequests(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(PaymentRequest)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();
  }
}
