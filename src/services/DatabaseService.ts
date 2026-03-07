import { DataSource } from 'typeorm';
import { getDataSourceOptions } from '@/config/database';
import { logger } from '@/utils/logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private dataSource: DataSource | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      this.dataSource = new DataSource(getDataSourceOptions());
      await this.dataSource.initialize();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  public async close(): Promise<void> {
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      logger.info('Database connection closed');
    }
  }

  public async runMigrations(): Promise<void> {
    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }
    
    try {
      await this.dataSource.runMigrations();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Failed to run migrations:', error);
      throw error;
    }
  }

  public async checkConnection(): Promise<boolean> {
    try {
      if (!this.dataSource || !this.dataSource.isInitialized) {
        return false;
      }
      
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database connection check failed:', error);
      return false;
    }
  }
}
