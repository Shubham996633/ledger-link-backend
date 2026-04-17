import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '@/utils/logger';

export class WebSocketService {
  private io: Server;
  private static instance: WebSocketService;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'https://ledger-link-frontend.onrender.com',
          ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/ws',
    });

    this.setupHandlers();
    WebSocketService.instance = this;
    logger.info('WebSocket server initialized on /ws');
  }

  static getInstance(): WebSocketService | null {
    return WebSocketService.instance || null;
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);

      socket.on('subscribe', (channel: string) => {
        socket.join(channel);
        logger.info(`Client ${socket.id} subscribed to ${channel}`);
      });

      socket.on('unsubscribe', (channel: string) => {
        socket.leave(channel);
      });

      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit a new block event to all connected clients
   */
  emitNewBlock(block: any): void {
    this.io.emit('new-block', {
      type: 'new-block',
      data: {
        id: block.id,
        blockNumber: block.blockNumber,
        hash: block.hash,
        previousHash: block.previousHash,
        transactionCount: block.transactionCount,
        minerAddress: block.minerAddress,
        timestamp: block.timestamp,
        difficulty: block.difficulty,
        totalGasUsed: block.totalGasUsed,
        blockReward: block.blockReward,
        sizeBytes: block.sizeBytes,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Emit a new transaction event
   */
  emitNewTransaction(transaction: any): void {
    this.io.emit('new-transaction', {
      type: 'new-transaction',
      data: {
        id: transaction.id,
        hash: transaction.hash,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        tokenSymbol: transaction.tokenSymbol,
        status: transaction.status,
        gasUsed: transaction.gasUsed,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Emit mempool update
   */
  emitMempoolUpdate(mempoolSize: number): void {
    this.io.emit('mempool-update', {
      type: 'mempool-update',
      data: { size: mempoolSize },
      timestamp: Date.now(),
    });
  }

  /**
   * Emit blockchain stats update
   */
  emitStatsUpdate(stats: any): void {
    this.io.emit('stats-update', {
      type: 'stats-update',
      data: stats,
      timestamp: Date.now(),
    });
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.io.engine.clientsCount;
  }
}
