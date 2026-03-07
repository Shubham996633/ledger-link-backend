import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '@/entities/User';
import { Transaction } from '@/entities/Transaction';
import { Wallet } from '@/entities/Wallet';
import { WalletBalance } from '@/entities/WalletBalance';
import { PaymentRequest } from '@/entities/PaymentRequest';
import { Block } from '@/entities/Block';
import { AuditLog } from '@/entities/AuditLog';
import { HealthRecord } from '@/entities/HealthRecord';
import { SupplyChainItem } from '@/entities/SupplyChainItem';
import { TokenPurchase } from '@/entities/TokenPurchase';

export function getDataSourceOptions(): DataSourceOptions {
  const isDev = process.env.NODE_ENV === 'development';
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ledger_link',
    synchronize: false, // Tables already created, avoid column type conflicts
    logging: isDev,
    entities: [User, Transaction, Wallet, WalletBalance, PaymentRequest, Block, AuditLog, HealthRecord, SupplyChainItem, TokenPurchase],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscribers/**/*.ts'],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

// Keep backward compat for static import
export const dataSourceOptions: DataSourceOptions = getDataSourceOptions();
