import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { UserRepository } from '@/repositories/UserRepository';
import { WalletRepository } from '@/repositories/WalletRepository';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { encrypt, decrypt } from '@/utils/encryption';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface WalletAuthPayload {
  address: string;
  signature: string;
  message: string;
  timestamp: number;
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private walletRepository: WalletRepository
  ) {}

  /**
   * Generate a message for wallet signature
   */
  generateAuthMessage(address: string): string {
    const timestamp = Date.now();
    const message = `Ledger Link Authentication\nAddress: ${address}\nTimestamp: ${timestamp}`;
    return message;
  }

  /**
   * Verify wallet signature and authenticate user
   */
  async authenticateWithWallet(payload: WalletAuthPayload): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Verify the signature
      const isValidSignature = this.verifySignature(payload);
      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Check if signature is not too old (5 minutes)
      const now = Date.now();
      if (now - payload.timestamp > 5 * 60 * 1000) {
        throw new Error('Signature expired');
      }

      // Find or create user
      let user = await this.userRepository.findByEmail(payload.address);
      if (!user) {
        user = await this.userRepository.create({
          email: payload.address,
          username: `user_${payload.address.slice(0, 8)}`,
          isEmailVerified: true, // Wallet addresses are considered verified
        });
      }

      // Find or create wallet
      let wallet = await this.walletRepository.findByAddress(payload.address);
      if (!wallet) {
        wallet = await this.walletRepository.create({
          address: payload.address,
          userId: user.id,
          blockchain: 'ethereum',
          network: 'goerli', // TODO: Make this configurable
          isActive: true,
          isPrimary: true,
        });
      } else {
        // Update last used
        await this.walletRepository.updateLastUsed(wallet.id);
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      logger.info(`User authenticated with wallet: ${payload.address}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Wallet authentication failed:', error);
      throw error;
    }
  }

  /**
   * Verify wallet signature
   */
  private verifySignature(payload: WalletAuthPayload): boolean {
    try {
      const message = `Ledger Link Authentication\nAddress: ${payload.address}\nTimestamp: ${payload.timestamp}`;
      const recoveredAddress = ethers.verifyMessage(message, payload.signature);
      return recoveredAddress.toLowerCase() === payload.address.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(user: any): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.verifyToken(refreshToken);
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // TODO: Add traditional email/password authentication
  // TODO: Add 2FA support
  // TODO: Add social login integration
  // TODO: Add session management
  // TODO: Add logout functionality
}
