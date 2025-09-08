import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ledger Link API',
      version: '1.0.0',
      description: 'A decentralized platform integrating Ethereum smart contracts with Node.js backend',
      contact: {
        name: 'Ledger Link Team',
        email: 'support@ledgerlink.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.ledgerlink.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        walletAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Wallet-Signature',
          description: 'Wallet signature for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'User username',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'moderator'],
              description: 'User role',
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status',
            },
            profileImageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Profile image URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Transaction unique identifier',
            },
            hash: {
              type: 'string',
              description: 'Blockchain transaction hash',
            },
            fromAddress: {
              type: 'string',
              description: 'Sender wallet address',
            },
            toAddress: {
              type: 'string',
              description: 'Recipient wallet address',
            },
            amount: {
              type: 'string',
              description: 'Transaction amount in wei',
            },
            tokenAddress: {
              type: 'string',
              description: 'Token contract address (for ERC-20)',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'failed', 'cancelled'],
              description: 'Transaction status',
            },
            blockNumber: {
              type: 'integer',
              description: 'Block number where transaction was mined',
            },
            gasUsed: {
              type: 'string',
              description: 'Gas used for transaction',
            },
            transactionFee: {
              type: 'string',
              description: 'Transaction fee in wei',
            },
            description: {
              type: 'string',
              description: 'User-defined transaction description',
            },
            blockchain: {
              type: 'string',
              description: 'Blockchain network',
            },
            network: {
              type: 'string',
              description: 'Network name',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation timestamp',
            },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Wallet unique identifier',
            },
            address: {
              type: 'string',
              description: 'Wallet address',
            },
            blockchain: {
              type: 'string',
              description: 'Blockchain type',
            },
            network: {
              type: 'string',
              description: 'Network name',
            },
            isActive: {
              type: 'boolean',
              description: 'Wallet active status',
            },
            isPrimary: {
              type: 'boolean',
              description: 'Primary wallet flag',
            },
            label: {
              type: 'string',
              description: 'User-defined wallet label',
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last usage timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Validation errors',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
