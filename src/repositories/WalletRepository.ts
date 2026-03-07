import { Repository, DataSource } from 'typeorm';
import { Wallet } from '@/entities/Wallet';

export class WalletRepository {
  private repository: Repository<Wallet>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Wallet);
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByAddress(address: string): Promise<Wallet | null> {
    return this.repository.findOne({ where: { address } });
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return this.repository.find({ where: { userId } });
  }

  async findPrimaryWallet(userId: string): Promise<Wallet | null> {
    return this.repository.findOne({ 
      where: { userId, isPrimary: true, isActive: true } 
    });
  }

  async create(walletData: Partial<Wallet>): Promise<Wallet> {
    const wallet = this.repository.create(walletData);
    return this.repository.save(wallet);
  }

  async update(id: string, walletData: Partial<Wallet>): Promise<Wallet | null> {
    await this.repository.update(id, walletData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async setPrimaryWallet(userId: string, walletId: string): Promise<void> {
    // First, unset all primary wallets for the user
    await this.repository.update(
      { userId, isPrimary: true },
      { isPrimary: false }
    );
    
    // Then set the new primary wallet
    await this.repository.update(walletId, { isPrimary: true });
  }

  async updateLastUsed(walletId: string): Promise<void> {
    await this.repository.update(walletId, { lastUsedAt: new Date() });
  }

  async findByNetwork(userId: string, network: string): Promise<Wallet[]> {
    return this.repository.find({ 
      where: { userId, network, isActive: true } 
    });
  }

  // TODO: Add wallet balance tracking
  // TODO: Add wallet activity monitoring
  // TODO: Add wallet verification status
  // TODO: Add bulk wallet operations
}
