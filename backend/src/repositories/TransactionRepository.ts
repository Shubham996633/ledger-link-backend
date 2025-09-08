import { Repository, DataSource } from 'typeorm';
import { Transaction } from '@/entities/Transaction';

export class TransactionRepository {
  private repository: Repository<Transaction>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByHash(hash: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { hash } });
  }

  async findByUserId(userId: string, limit: number = 10, offset: number = 0): Promise<Transaction[]> {
    return this.repository.find({
      where: { userId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async findByAddress(address: string, limit: number = 10, offset: number = 0): Promise<Transaction[]> {
    return this.repository.find({
      where: [
        { fromAddress: address },
        { toAddress: address }
      ],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string, limit: number = 10, offset: number = 0): Promise<Transaction[]> {
    return this.repository.find({
      where: { status },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

  async update(id: string, transactionData: Partial<Transaction>): Promise<Transaction | null> {
    await this.repository.update(id, transactionData);
    return this.findById(id);
  }

  async updateByHash(hash: string, transactionData: Partial<Transaction>): Promise<Transaction | null> {
    await this.repository.update({ hash }, transactionData);
    return this.findByHash(hash);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async getTransactionStats(userId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
  }> {
    const [total, pending, confirmed, failed] = await Promise.all([
      this.repository.count({ where: { userId } }),
      this.repository.count({ where: { userId, status: 'pending' } }),
      this.repository.count({ where: { userId, status: 'confirmed' } }),
      this.repository.count({ where: { userId, status: 'failed' } }),
    ]);

    return { total, pending, confirmed, failed };
  }

  async getRecentTransactions(userId: string, days: number = 7): Promise<Transaction[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // TODO: Add transaction filtering by date range
  // TODO: Add transaction search functionality
  // TODO: Add transaction analytics
  // TODO: Add bulk transaction operations
}
