import { Pool, PoolConfig } from 'pg';
import winston from 'winston';

export class Database {
  private pool: Pool;
  private logger: winston.Logger;

  constructor(config: PoolConfig, logger: winston.Logger) {
    this.logger = logger;
    this.pool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', { error: err });
      process.exit(-1);
    });
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      this.logger.error('Database query error', { text, error });
      throw error;
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database pool closed');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', { error });
      return false;
    }
  }
}