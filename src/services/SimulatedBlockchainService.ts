import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import { Block } from '@/entities/Block';
import { Transaction } from '@/entities/Transaction';
import { logger } from '@/utils/logger';
import { WebSocketService } from './WebSocketService';
import crypto from 'crypto';

interface MempoolTransaction {
  transactionId: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  tokenSymbol: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  priority: number; // higher gas price = higher priority
}

interface Validator {
  address: string;
  stake: number;
  isActive: boolean;
  blocksValidated: number;
}

interface ConsensusConfig {
  mechanism: 'pow' | 'pos';
  posMinStake: number;
  posValidatorCount: number;
}

interface BlockStats {
  totalBlocks: number;
  totalTransactions: number;
  avgBlockTime: number;
  avgTransactionsPerBlock: number;
  currentDifficulty: number;
  hashRate: string;
  latestBlockNumber: number;
  latestBlockHash: string;
  totalGasUsed: string;
  networkUptime: number;
  consensusMechanism: string;
  activeValidators: number;
}

/**
 * SimulatedBlockchainService
 * Creates a realistic blockchain simulation with blocks, hashing, mining, and consensus.
 * No real blockchain network needed - everything runs in PostgreSQL.
 */
export class SimulatedBlockchainService {
  private blockRepository: Repository<Block>;
  private transactionRepository: Repository<Transaction>;
  private mempool: MempoolTransaction[] = [];
  private miningInterval: NodeJS.Timeout | null = null;
  private readonly BLOCK_TIME_MS = parseInt(process.env.BLOCK_TIME_MS || '12000', 10);
  private readonly MINE_EMPTY_BLOCKS = process.env.MINE_EMPTY_BLOCKS !== 'false';
  private readonly MAX_TRANSACTIONS_PER_BLOCK = 50;
  private readonly GENESIS_MINER = '0x0000000000000000000000000000000000000000';
  private readonly NETWORK_MINER = '0x4c65646765724c696e6b4d696e657200000000'; // "LedgerLinkMiner"
  private difficulty = 2;
  private isInitialized = false;

  // Proof-of-Stake simulation
  private consensus: ConsensusConfig = {
    mechanism: 'pos',
    posMinStake: 32, // 32 ETH like Ethereum 2.0
    posValidatorCount: 5,
  };
  private validators: Validator[] = [
    { address: '0x4c65646765724c696e6b56616c696461746f7231', stake: 64, isActive: true, blocksValidated: 0 },
    { address: '0x4c65646765724c696e6b56616c696461746f7232', stake: 48, isActive: true, blocksValidated: 0 },
    { address: '0x4c65646765724c696e6b56616c696461746f7233', stake: 32, isActive: true, blocksValidated: 0 },
    { address: '0x4c65646765724c696e6b56616c696461746f7234', stake: 96, isActive: true, blocksValidated: 0 },
    { address: '0x4c65646765724c696e6b56616c696461746f7235', stake: 50, isActive: true, blocksValidated: 0 },
  ];

  // Gas calculation constants
  private static readonly GAS_COSTS = {
    BASE_TRANSFER: 21000,
    PER_BYTE_DATA: 16,
    PER_ZERO_BYTE: 4,
    CONTRACT_CREATION: 53000,
    TOKEN_TRANSFER: 65000,
    COMPLEX_OPERATION: 100000,
  };

  constructor(private dataSource: DataSource) {
    this.blockRepository = dataSource.getRepository(Block);
    this.transactionRepository = dataSource.getRepository(Transaction);
  }

  /**
   * Initialize the blockchain - create genesis block if needed and start mining
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const latestBlock = await this.getLatestBlock();
      if (!latestBlock) {
        await this.createGenesisBlock();
        logger.info('Genesis block created');
      }

      // Retroactively assign blocks to existing transactions that have no block
      await this.assignBlocksToOrphanTransactions();

      this.startMining();
      this.isInitialized = true;
      logger.info('Simulated blockchain initialized');
    } catch (error) {
      logger.error('Failed to initialize simulated blockchain:', error);
      throw error;
    }
  }

  /**
   * Create the genesis block (block 0)
   */
  private async createGenesisBlock(): Promise<Block> {
    const timestamp = Date.now();
    const genesisData = `Genesis Block - Ledger Link Simulated Blockchain - ${timestamp}`;
    const hash = this.calculateHash(0, '0'.repeat(64), genesisData, 0, timestamp);

    const block = this.blockRepository.create({
      blockNumber: 0,
      hash,
      previousHash: '0'.repeat(64),
      merkleRoot: this.calculateHash(0, '', 'genesis', 0, timestamp),
      nonce: '0',
      difficulty: this.difficulty,
      timestamp: timestamp.toString(),
      minerAddress: this.GENESIS_MINER,
      transactionCount: 0,
      transactionHashes: [],
      totalGasUsed: '0',
      blockReward: '0',
      sizeBytes: Buffer.byteLength(genesisData),
      stateRoot: this.generateStateRoot(),
      metadata: {
        type: 'genesis',
        message: 'Ledger Link Simulated Blockchain - Genesis Block',
        version: '1.0.0',
      },
    });

    return this.blockRepository.save(block);
  }

  /**
   * Assign blocks to transactions that were created before the blockchain engine
   */
  private async assignBlocksToOrphanTransactions(): Promise<void> {
    const orphanTxs = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.is_simulated = :isSimulated', { isSimulated: true })
      .andWhere('tx.block_number IS NULL')
      .orderBy('tx.created_at', 'ASC')
      .getMany();

    if (orphanTxs.length === 0) return;

    logger.info(`Found ${orphanTxs.length} orphan transactions, assigning to blocks...`);

    const latestBlock = await this.getLatestBlock();
    let currentBlockNumber = latestBlock ? latestBlock.blockNumber : 0;

    // Group orphan transactions into blocks of MAX_TRANSACTIONS_PER_BLOCK
    for (let i = 0; i < orphanTxs.length; i += this.MAX_TRANSACTIONS_PER_BLOCK) {
      const batch = orphanTxs.slice(i, i + this.MAX_TRANSACTIONS_PER_BLOCK);
      currentBlockNumber++;

      const previousBlock = await this.getBlockByNumber(currentBlockNumber - 1);
      const previousHash = previousBlock ? previousBlock.hash : '0'.repeat(64);

      const block = await this.mineBlock(batch, previousHash, currentBlockNumber);

      // Update transactions with block info
      for (const tx of batch) {
        tx.blockNumber = block.blockNumber;
        tx.confirmations = 1;
        await this.transactionRepository.save(tx);
      }
    }

    logger.info(`Assigned ${orphanTxs.length} transactions to ${currentBlockNumber - (latestBlock?.blockNumber || 0)} new blocks`);
  }

  /**
   * Calculate SHA-256 hash for block data
   */
  private calculateHash(
    blockNumber: number,
    previousHash: string,
    data: string,
    nonce: number,
    timestamp: number
  ): string {
    const input = `${blockNumber}${previousHash}${data}${nonce}${timestamp}`;
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Calculate Merkle root from transaction hashes
   */
  private calculateMerkleRoot(transactionHashes: string[]): string {
    if (transactionHashes.length === 0) {
      return crypto.createHash('sha256').update('empty').digest('hex');
    }

    let hashes = [...transactionHashes];

    while (hashes.length > 1) {
      const newLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left; // duplicate last if odd
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        newLevel.push(combined);
      }
      hashes = newLevel;
    }

    return hashes[0];
  }

  /**
   * Generate a state root hash (simulates world state)
   */
  private generateStateRoot(): string {
    return crypto.createHash('sha256').update(`state-${Date.now()}-${Math.random()}`).digest('hex');
  }

  /**
   * Select a validator using stake-weighted random selection (PoS simulation)
   */
  private selectValidator(): Validator {
    const activeValidators = this.validators.filter(v => v.isActive && v.stake >= this.consensus.posMinStake);
    if (activeValidators.length === 0) {
      return this.validators[0]; // fallback
    }

    const totalStake = activeValidators.reduce((sum, v) => sum + v.stake, 0);
    let random = Math.random() * totalStake;

    for (const validator of activeValidators) {
      random -= validator.stake;
      if (random <= 0) {
        validator.blocksValidated++;
        return validator;
      }
    }

    return activeValidators[activeValidators.length - 1];
  }

  /**
   * Calculate dynamic gas for a transaction based on type and data size
   */
  static calculateGas(txType: 'transfer' | 'token_transfer' | 'contract_creation' | 'complex', dataSize: number = 0): { gasUsed: number; gasPrice: string } {
    const GAS = SimulatedBlockchainService.GAS_COSTS;
    let gasUsed: number;

    switch (txType) {
      case 'token_transfer':
        gasUsed = GAS.TOKEN_TRANSFER;
        break;
      case 'contract_creation':
        gasUsed = GAS.CONTRACT_CREATION;
        break;
      case 'complex':
        gasUsed = GAS.COMPLEX_OPERATION;
        break;
      default:
        gasUsed = GAS.BASE_TRANSFER;
    }

    // Add per-byte cost for data payload
    if (dataSize > 0) {
      gasUsed += dataSize * GAS.PER_BYTE_DATA;
    }

    // Simulate fluctuating gas price (base fee + priority fee)
    const baseFee = 20_000_000_000; // 20 Gwei
    const priorityFee = Math.floor(Math.random() * 5_000_000_000); // 0-5 Gwei tip
    const gasPrice = (baseFee + priorityFee).toString();

    return { gasUsed, gasPrice };
  }

  /**
   * Proof-of-Work mining simulation
   * Finds a nonce such that hash starts with `difficulty` number of zeros
   */
  private proofOfWork(
    blockNumber: number,
    previousHash: string,
    merkleRoot: string,
    timestamp: number
  ): { hash: string; nonce: number } {
    const target = '0'.repeat(this.difficulty);
    let nonce = 0;
    let hash = '';

    // Limit iterations for simulation (don't actually burn CPU)
    const maxIterations = 10000;
    const data = `${merkleRoot}`;

    while (nonce < maxIterations) {
      hash = this.calculateHash(blockNumber, previousHash, data, nonce, timestamp);
      if (hash.startsWith(target)) {
        return { hash, nonce };
      }
      nonce++;
    }

    // If no valid hash found within limit, use the last computed hash
    // (this is a simulation - we don't need real PoW difficulty)
    return { hash, nonce };
  }

  /**
   * Mine a new block with given transactions
   */
  private async mineBlock(
    transactions: Transaction[],
    previousHash: string,
    blockNumber: number
  ): Promise<Block> {
    const timestamp = Date.now();
    const transactionHashes = transactions.map(tx => tx.hash);
    const merkleRoot = this.calculateMerkleRoot(transactionHashes);

    // Select validator (PoS) or use PoW depending on consensus
    let hash: string;
    let nonce: number;
    let minerAddress: string;

    if (this.consensus.mechanism === 'pos') {
      const validator = this.selectValidator();
      minerAddress = validator.address;
      nonce = 0;
      hash = this.calculateHash(blockNumber, previousHash, merkleRoot, nonce, timestamp);
    } else {
      const pow = this.proofOfWork(blockNumber, previousHash, merkleRoot, timestamp);
      hash = pow.hash;
      nonce = pow.nonce;
      minerAddress = this.NETWORK_MINER;
    }

    // Calculate total gas used
    const totalGasUsed = transactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.gasUsed || '21000');
    }, 0);

    // Estimate block size
    const sizeBytes = transactions.reduce((sum, tx) => {
      return sum + JSON.stringify(tx).length;
    }, 200); // 200 bytes for block header

    const block = this.blockRepository.create({
      blockNumber,
      hash,
      previousHash,
      merkleRoot,
      nonce: nonce.toString(),
      difficulty: this.difficulty,
      timestamp: timestamp.toString(),
      minerAddress,
      transactionCount: transactions.length,
      transactionHashes,
      totalGasUsed: totalGasUsed.toString(),
      blockReward: '2.0',
      sizeBytes,
      stateRoot: this.generateStateRoot(),
      metadata: {
        miningDuration: Math.floor(Math.random() * 3000) + 500,
        gasLimit: '30000000',
        baseFeePerGas: '20000000000',
        consensusMechanism: this.consensus.mechanism,
        validatorAddress: minerAddress,
      },
    });

    return this.blockRepository.save(block);
  }

  /**
   * Add a transaction to the mempool
   */
  addToMempool(transaction: Transaction): void {
    const mempoolTx: MempoolTransaction = {
      transactionId: transaction.id,
      hash: transaction.hash,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      tokenSymbol: transaction.tokenSymbol,
      gasUsed: transaction.gasUsed,
      gasPrice: transaction.gasPrice,
      timestamp: Date.now(),
      priority: parseFloat(transaction.gasPrice || '20000000000'),
    };

    this.mempool.push(mempoolTx);
    // Sort by gas price (higher priority first)
    this.mempool.sort((a, b) => b.priority - a.priority);

    logger.info(`Transaction ${transaction.hash.slice(0, 10)}... added to mempool (${this.mempool.length} pending)`);

    // Emit WebSocket event
    const ws = WebSocketService.getInstance();
    if (ws) ws.emitMempoolUpdate(this.mempool.length);
  }

  /**
   * Process mempool - mine pending transactions into a new block
   */
  async processMempool(): Promise<Block | null> {
    if (this.mempool.length === 0) {
      if (!this.MINE_EMPTY_BLOCKS) return null;

      // Mine empty block occasionally (like real blockchain)
      const latestBlock = await this.getLatestBlock();
      if (!latestBlock) return null;

      // Only mine empty blocks every ~5th cycle
      if (Math.random() > 0.2) return null;

      const emptyBlock = await this.mineBlock(
        [],
        latestBlock.hash,
        latestBlock.blockNumber + 1
      );
      logger.info(`Mined empty block #${emptyBlock.blockNumber}`);
      // Emit WebSocket event
      const ws = WebSocketService.getInstance();
      if (ws) ws.emitNewBlock(emptyBlock);
      return emptyBlock;
    }

    // Take transactions from mempool (up to limit)
    const txsToMine = this.mempool.splice(0, this.MAX_TRANSACTIONS_PER_BLOCK);

    // Fetch actual transaction records
    const transactionIds = txsToMine.map(tx => tx.transactionId);
    const transactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.id IN (:...ids)', { ids: transactionIds })
      .getMany();

    if (transactions.length === 0) return null;

    const latestBlock = await this.getLatestBlock();
    if (!latestBlock) return null;

    const block = await this.mineBlock(
      transactions,
      latestBlock.hash,
      latestBlock.blockNumber + 1
    );

    // Update transactions with block info
    for (const tx of transactions) {
      tx.blockNumber = block.blockNumber;
      tx.confirmations = 1;
      tx.status = 'confirmed';
      await this.transactionRepository.save(tx);
    }

    // Update confirmations for older blocks
    await this.updateConfirmations(block.blockNumber);

    // Adjust difficulty periodically (every 10 blocks)
    if (block.blockNumber % 10 === 0) {
      this.adjustDifficulty();
    }

    logger.info(
      `Mined block #${block.blockNumber} with ${transactions.length} transactions (hash: ${block.hash.slice(0, 16)}...)`
    );

    // Emit WebSocket events
    const ws = WebSocketService.getInstance();
    if (ws) {
      ws.emitNewBlock(block);
      for (const tx of transactions) {
        ws.emitNewTransaction(tx);
      }
      ws.emitMempoolUpdate(this.mempool.length);
    }

    return block;
  }

  /**
   * Update confirmation counts for transactions in older blocks
   */
  private async updateConfirmations(currentBlockNumber: number): Promise<void> {
    // Update confirmations for transactions in recent blocks
    const recentBlocks = await this.blockRepository.find({
      where: { blockNumber: LessThanOrEqual(currentBlockNumber) },
      order: { blockNumber: 'DESC' },
      take: 20,
    });

    for (const block of recentBlocks) {
      const confirmations = currentBlockNumber - block.blockNumber + 1;
      if (block.transactionHashes.length > 0) {
        await this.transactionRepository
          .createQueryBuilder()
          .update(Transaction)
          .set({ confirmations })
          .where('hash IN (:...hashes)', { hashes: block.transactionHashes })
          .execute();
      }
    }
  }

  /**
   * Adjust mining difficulty based on block time
   */
  private adjustDifficulty(): void {
    // Simple difficulty adjustment - keep it between 1 and 4
    const newDifficulty = Math.max(1, Math.min(4, this.difficulty + (Math.random() > 0.5 ? 1 : -1)));
    if (newDifficulty !== this.difficulty) {
      logger.info(`Difficulty adjusted: ${this.difficulty} -> ${newDifficulty}`);
      this.difficulty = newDifficulty;
    }
  }

  /**
   * Start the mining loop
   */
  startMining(): void {
    if (this.miningInterval) return;

    this.miningInterval = setInterval(async () => {
      try {
        await this.processMempool();
      } catch (error) {
        logger.error('Mining error:', error);
      }
    }, this.BLOCK_TIME_MS);

    logger.info(`Mining started (block time: ${this.BLOCK_TIME_MS / 1000}s)`);
  }

  /**
   * Stop the mining loop
   */
  stopMining(): void {
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
      logger.info('Mining stopped');
    }
  }

  // ============= Query Methods =============

  /**
   * Get the latest block
   */
  async getLatestBlock(): Promise<Block | null> {
    const blocks = await this.blockRepository.find({
      order: { blockNumber: 'DESC' },
      take: 1,
    });
    return blocks.length > 0 ? blocks[0] : null;
  }

  /**
   * Get block by number
   */
  async getBlockByNumber(blockNumber: number): Promise<Block | null> {
    return this.blockRepository.findOneBy({ blockNumber });
  }

  /**
   * Get block by hash
   */
  async getBlockByHash(hash: string): Promise<Block | null> {
    return this.blockRepository.findOneBy({ hash });
  }

  /**
   * Get blocks with pagination
   */
  async getBlocks(limit: number = 20, offset: number = 0): Promise<{ blocks: Block[]; total: number }> {
    const [blocks, total] = await this.blockRepository.findAndCount({
      order: { blockNumber: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { blocks, total };
  }

  /**
   * Get transactions in a specific block
   */
  async getBlockTransactions(blockNumber: number): Promise<Transaction[]> {
    const block = await this.getBlockByNumber(blockNumber);
    if (!block || block.transactionHashes.length === 0) return [];

    return this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.hash IN (:...hashes)', { hashes: block.transactionHashes })
      .orderBy('tx.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Get current mempool status
   */
  getMempool(): { transactions: MempoolTransaction[]; size: number } {
    return {
      transactions: [...this.mempool],
      size: this.mempool.length,
    };
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats(): Promise<BlockStats> {
    const totalBlocks = await this.blockRepository.count();
    const latestBlock = await this.getLatestBlock();

    const totalTransactions = await this.transactionRepository.count({
      where: { isSimulated: true },
    });

    // Calculate average block time from recent blocks
    const recentBlocks = await this.blockRepository.find({
      order: { blockNumber: 'DESC' },
      take: 10,
    });

    let avgBlockTime = this.BLOCK_TIME_MS / 1000;
    if (recentBlocks.length > 1) {
      const timeDiffs: number[] = [];
      for (let i = 0; i < recentBlocks.length - 1; i++) {
        const diff = parseInt(recentBlocks[i].timestamp) - parseInt(recentBlocks[i + 1].timestamp);
        timeDiffs.push(diff);
      }
      avgBlockTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length / 1000;
    }

    // Average transactions per block
    const avgTxPerBlock = totalBlocks > 0 ? totalTransactions / totalBlocks : 0;

    // Total gas used
    const gasResult = await this.blockRepository
      .createQueryBuilder('block')
      .select('SUM(CAST(block.totalGasUsed AS DECIMAL))', 'total')
      .getRawOne();

    // Network uptime (time since genesis)
    const genesisBlock = await this.getBlockByNumber(0);
    const networkUptime = genesisBlock
      ? (Date.now() - parseInt(genesisBlock.timestamp)) / 1000
      : 0;

    // Simulated hash rate
    const hashRate = (Math.pow(16, this.difficulty) / avgBlockTime).toFixed(2);

    return {
      totalBlocks,
      totalTransactions,
      avgBlockTime: Math.round(avgBlockTime * 100) / 100,
      avgTransactionsPerBlock: Math.round(avgTxPerBlock * 100) / 100,
      currentDifficulty: this.difficulty,
      hashRate: `${hashRate} H/s`,
      latestBlockNumber: latestBlock?.blockNumber || 0,
      latestBlockHash: latestBlock?.hash || '',
      totalGasUsed: gasResult?.total || '0',
      networkUptime: Math.round(networkUptime),
      consensusMechanism: this.consensus.mechanism,
      activeValidators: this.validators.filter(v => v.isActive).length,
    };
  }

  /**
   * Verify blockchain integrity - check all block hashes form valid chain
   */
  async verifyChainIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    const blocks = await this.blockRepository.find({
      order: { blockNumber: 'ASC' },
    });

    const errors: string[] = [];

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Check previous hash reference
      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(
          `Block #${currentBlock.blockNumber}: previousHash mismatch. Expected ${previousBlock.hash.slice(0, 16)}..., got ${currentBlock.previousHash.slice(0, 16)}...`
        );
      }

      // Check block number sequence
      if (currentBlock.blockNumber !== previousBlock.blockNumber + 1) {
        errors.push(
          `Block #${currentBlock.blockNumber}: non-sequential block number after #${previousBlock.blockNumber}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
