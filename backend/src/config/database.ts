import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '@/entities/User';
import { Transaction } from '@/entities/Transaction';
import { Wallet } from '@/entities/Wallet';
import { WalletBalance } from '@/entities/WalletBalance';
import { PaymentRequest } from '@/entities/PaymentRequest';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ledger_link',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Transaction, Wallet, WalletBalance, PaymentRequest],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const config = new DataSource(dataSourceOptions);

// TODO: Add connection pooling configuration
// TODO: Add database health check
// TODO: Add migration runner
// TODO: Add seed data functionality
