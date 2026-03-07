import { ethers } from 'ethers';

// Ethereum network configuration
export const blockchainConfig = {
  // TODO: Add support for multiple networks (mainnet, testnets)
  networks: {
    goerli: {
      rpcUrl: process.env.GOERLI_RPC_URL || 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
      chainId: 5,
      name: 'Goerli Testnet',
    },
    arbitrumGoerli: {
      rpcUrl: process.env.ARBITRUM_GOERLI_RPC_URL || 'https://goerli-rollup.arbitrum.io/rpc',
      chainId: 421613,
      name: 'Arbitrum Goerli Testnet',
    },
    // TODO: Add mainnet configurations
    // mainnet: { ... },
    // arbitrum: { ... },
  },
  
  // Default network
  defaultNetwork: process.env.DEFAULT_NETWORK || 'goerli',
  
  // Contract addresses (will be populated after deployment)
  contracts: {
    transactionLogger: process.env.TRANSACTION_LOGGER_CONTRACT || '',
    // TODO: Add more contract addresses as needed
  },
  
  // Gas configuration
  gas: {
    gasLimit: process.env.GAS_LIMIT || '500000',
    gasPrice: process.env.GAS_PRICE || '20000000000', // 20 gwei
  },
};

// Provider factory
export function createProvider(networkName: string = blockchainConfig.defaultNetwork) {
  const network = blockchainConfig.networks[networkName as keyof typeof blockchainConfig.networks];
  if (!network) {
    throw new Error(`Network ${networkName} not configured`);
  }
  
  return new ethers.JsonRpcProvider(network.rpcUrl);
}

// Wallet factory
export function createWallet(privateKey: string, networkName: string = blockchainConfig.defaultNetwork) {
  const provider = createProvider(networkName);
  return new ethers.Wallet(privateKey, provider);
}

// TODO: Add contract factory functions
// TODO: Add transaction monitoring utilities
// TODO: Add event listener setup
// TODO: Add gas estimation utilities
