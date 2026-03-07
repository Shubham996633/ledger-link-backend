import { ethers } from 'ethers';
import { createProvider, createWallet, blockchainConfig } from '@/config/blockchain';
import { logger } from '@/utils/logger';
import { TransactionRepository } from '@/repositories/TransactionRepository';

export interface TransactionRequest {
  fromAddress: string;
  toAddress: string;
  amount: string;
  privateKey: string;
  network?: string;
  tokenAddress?: string; // For ERC-20 tokens
  data?: string;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  transactionFee?: string;
}

export class BlockchainService {
  constructor(private transactionRepository: TransactionRepository) {}

  /**
   * Send ETH transaction
   */
  async sendTransaction(request: TransactionRequest): Promise<TransactionResult> {
    try {
      const provider = createProvider(request.network || blockchainConfig.defaultNetwork);
      const wallet = createWallet(request.privateKey, request.network);

      // Estimate gas
      const gasEstimate = await provider.estimateGas({
        to: request.toAddress,
        value: ethers.parseEther(request.amount),
        data: request.data,
      });

      // Build transaction
      const transaction = {
        to: request.toAddress,
        value: ethers.parseEther(request.amount),
        gasLimit: gasEstimate,
        gasPrice: ethers.parseUnits(blockchainConfig.gas.gasPrice, 'gwei'),
        data: request.data || '0x',
      };

      // Send transaction
      const txResponse = await wallet.sendTransaction(transaction);
      logger.info(`Transaction sent: ${txResponse.hash}`);

      // Save to database
      const dbTransaction = await this.transactionRepository.create({
        hash: txResponse.hash,
        userId: '', // TODO: Get from authenticated user
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        amount: ethers.parseEther(request.amount).toString(),
        status: 'pending',
        blockNumber: 0, // Will be updated when confirmed
        gasUsed: '0',
        gasPrice: transaction.gasPrice.toString(),
        transactionFee: '0',
        data: request.data || '',
        blockchain: 'ethereum',
        network: request.network || blockchainConfig.defaultNetwork,
      });

      // Wait for confirmation
      const receipt = (await txResponse.wait())!;
      
      // Update transaction status
      await this.transactionRepository.updateByHash(txResponse.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        transactionFee: (receipt.gasUsed * receipt.gasPrice).toString(),
      });

      return {
        hash: txResponse.hash,
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        transactionFee: (receipt.gasUsed * receipt.gasPrice).toString(),
      };
    } catch (error) {
      logger.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Send ERC-20 token transaction
   */
  async sendTokenTransaction(request: TransactionRequest): Promise<TransactionResult> {
    try {
      if (!request.tokenAddress) {
        throw new Error('Token address is required for token transactions');
      }

      const provider = createProvider(request.network || blockchainConfig.defaultNetwork);
      const wallet = createWallet(request.privateKey, request.network);

      // ERC-20 ABI for transfer function
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
      ];

      const tokenContract = new ethers.Contract(request.tokenAddress, erc20Abi, wallet);
      
      // Send token transaction
      const txResponse = await tokenContract.transfer(
        request.toAddress,
        ethers.parseUnits(request.amount, 18) // Assuming 18 decimals
      );

      logger.info(`Token transaction sent: ${txResponse.hash}`);

      // Save to database
      const dbTransaction = await this.transactionRepository.create({
        hash: txResponse.hash,
        userId: '', // TODO: Get from authenticated user
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        amount: ethers.parseUnits(request.amount, 18).toString(),
        tokenAddress: request.tokenAddress,
        status: 'pending',
        blockNumber: 0,
        gasUsed: '0',
        gasPrice: '0',
        transactionFee: '0',
        data: txResponse.data,
        blockchain: 'ethereum',
        network: request.network || blockchainConfig.defaultNetwork,
      });

      // Wait for confirmation
      const receipt = (await txResponse.wait())!;
      
      // Update transaction status
      await this.transactionRepository.updateByHash(txResponse.hash, {
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        transactionFee: (receipt.gasUsed * receipt.gasPrice).toString(),
      });

      return {
        hash: txResponse.hash,
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        transactionFee: (receipt.gasUsed * receipt.gasPrice).toString(),
      };
    } catch (error) {
      logger.error('Token transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(hash: string, network?: string): Promise<TransactionResult> {
    try {
      const provider = createProvider(network || blockchainConfig.defaultNetwork);
      const receipt = await provider.getTransactionReceipt(hash);

      if (!receipt) {
        return { hash, status: 'pending' };
      }

      return {
        hash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        transactionFee: (receipt.gasUsed * receipt.gasPrice).toString(),
      };
    } catch (error) {
      logger.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(address: string, network?: string): Promise<string> {
    try {
      const provider = createProvider(network || blockchainConfig.defaultNetwork);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('Failed to get wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(address: string, tokenAddress: string, network?: string): Promise<string> {
    try {
      const provider = createProvider(network || blockchainConfig.defaultNetwork);
      
      // ERC-20 ABI for balanceOf function
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const balance = await tokenContract.balanceOf(address);
      
      return ethers.formatUnits(balance, 18); // Assuming 18 decimals
    } catch (error) {
      logger.error('Failed to get token balance:', error);
      throw error;
    }
  }

  // TODO: Add transaction monitoring
  // TODO: Add event listening
  // TODO: Add gas optimization
  // TODO: Add multi-signature support
  // TODO: Add batch transactions
}
