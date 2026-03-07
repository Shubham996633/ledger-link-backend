import axios from 'axios';
import { logger } from '@/utils/logger';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdated: number;
}

interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
}

export class TokenMarketService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.binance.com';
  private priceCache: Map<string, { price: TokenPrice; cachedAt: number }> = new Map();
  private cacheTTL = 30000; // 30 seconds

  // Map our token symbols to Binance trading pairs
  private symbolMap: Record<string, string> = {
    ETH: 'ETHUSDT',
    BTC: 'BTCUSDT',
    USDT: 'USDTDAI', // USDT is ~$1
    USDC: 'USDCUSDT', // USDC is ~$1
    DAI: 'DAIUSDT',   // DAI is ~$1
    BNB: 'BNBUSDT',
    SOL: 'SOLUSDT',
    MATIC: 'MATICUSDT',
  };

  // Stablecoins are always ~$1
  private stablecoins = ['USDT', 'USDC', 'DAI'];

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
  }

  async getPrice(symbol: string): Promise<TokenPrice> {
    const upperSymbol = symbol.toUpperCase();

    // Check cache first
    const cached = this.priceCache.get(upperSymbol);
    if (cached && Date.now() - cached.cachedAt < this.cacheTTL) {
      return cached.price;
    }

    // Stablecoins are always $1
    if (this.stablecoins.includes(upperSymbol)) {
      const stablePrice: TokenPrice = {
        symbol: upperSymbol,
        price: 1.0,
        change24h: 0,
        volume24h: 0,
        lastUpdated: Date.now(),
      };
      this.priceCache.set(upperSymbol, { price: stablePrice, cachedAt: Date.now() });
      return stablePrice;
    }

    const binancePair = this.symbolMap[upperSymbol];
    if (!binancePair) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    try {
      const response = await axios.get<BinanceTickerResponse>(
        `${this.baseUrl}/api/v3/ticker/24hr`,
        {
          params: { symbol: binancePair },
          headers: this.apiKey ? { 'X-MBX-APIKEY': this.apiKey } : {},
          timeout: 5000,
        }
      );

      const data = response.data;
      const tokenPrice: TokenPrice = {
        symbol: upperSymbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume),
        lastUpdated: Date.now(),
      };

      this.priceCache.set(upperSymbol, { price: tokenPrice, cachedAt: Date.now() });
      logger.info(`Fetched ${upperSymbol} price: $${tokenPrice.price}`);
      return tokenPrice;
    } catch (error) {
      logger.error(`Failed to fetch price for ${symbol}:`, error);
      // Return fallback prices if API fails
      return this.getFallbackPrice(upperSymbol);
    }
  }

  async getAllPrices(): Promise<TokenPrice[]> {
    const symbols = Object.keys(this.symbolMap);
    const prices = await Promise.all(
      symbols.map(s => this.getPrice(s).catch(() => this.getFallbackPrice(s)))
    );
    return prices;
  }

  async getSupportedTokens(): Promise<{ symbol: string; name: string; isStablecoin: boolean }[]> {
    return [
      { symbol: 'ETH', name: 'Ethereum', isStablecoin: false },
      { symbol: 'BTC', name: 'Bitcoin', isStablecoin: false },
      { symbol: 'USDT', name: 'Tether', isStablecoin: true },
      { symbol: 'USDC', name: 'USD Coin', isStablecoin: true },
      { symbol: 'DAI', name: 'Dai', isStablecoin: true },
      { symbol: 'BNB', name: 'BNB', isStablecoin: false },
      { symbol: 'SOL', name: 'Solana', isStablecoin: false },
      { symbol: 'MATIC', name: 'Polygon', isStablecoin: false },
    ];
  }

  calculateTokenAmount(usdAmount: number, pricePerToken: number): string {
    if (pricePerToken <= 0) throw new Error('Invalid token price');
    const tokenAmount = usdAmount / pricePerToken;
    return tokenAmount.toFixed(18);
  }

  private getFallbackPrice(symbol: string): TokenPrice {
    const fallbackPrices: Record<string, number> = {
      ETH: 2500,
      BTC: 65000,
      USDT: 1,
      USDC: 1,
      DAI: 1,
      BNB: 350,
      SOL: 130,
      MATIC: 0.9,
    };

    return {
      symbol,
      price: fallbackPrices[symbol] || 1,
      change24h: 0,
      volume24h: 0,
      lastUpdated: Date.now(),
    };
  }
}
