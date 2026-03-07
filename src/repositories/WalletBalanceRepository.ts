import { Repository, DataSource } from 'typeorm';
import { WalletBalance } from '@/entities/WalletBalance';

export class WalletBalanceRepository {
  private repository: Repository<WalletBalance>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(WalletBalance);
  }

  /**
   * Create a new wallet balance
   */
  async create(data: Partial<WalletBalance>): Promise<WalletBalance> {
    const balance = this.repository.create(data);
    return await this.repository.save(balance);
  }

  /**
   * Find balance by wallet ID and token symbol
   */
  async findByWalletAndToken(
    walletId: string,
    tokenSymbol: string
  ): Promise<WalletBalance | null> {
    return await this.repository.findOne({
      where: { walletId, tokenSymbol },
    });
  }

  /**
   * Find all balances for a wallet
   */
  async findByWallet(walletId: string): Promise<WalletBalance[]> {
    return await this.repository.find({
      where: { walletId },
      order: { tokenSymbol: 'ASC' },
    });
  }

  /**
   * Update balance
   */
  async update(id: string, data: Partial<WalletBalance>): Promise<WalletBalance | null> {
    await this.repository.update(id, data);
    return await this.repository.findOne({ where: { id } });
  }

  /**
   * Delete balance
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  /**
   * Get total balance value across all tokens (for display purposes)
   */
  async getTotalValue(walletId: string): Promise<number> {
    const balances = await this.findByWallet(walletId);

    // Simple mock USD values for demonstration
    const mockPrices: Record<string, number> = {
      ETH: 2000,
      USDT: 1,
      USDC: 1,
      DAI: 1,
    };

    let totalValue = 0;
    for (const balance of balances) {
      const price = mockPrices[balance.tokenSymbol] || 0;
      totalValue += parseFloat(balance.balance) * price;
    }

    return totalValue;
  }
}
