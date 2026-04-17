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
  private twelveDataKey: string;
  private binanceUrl = 'https://api.binance.com';
  private coingeckoUrl = 'https://api.coingecko.com/api/v3';
  private twelveDataUrl = 'https://api.twelvedata.com';
  private priceCache: Map<string, { price: TokenPrice; cachedAt: number }> = new Map();
  private cacheTTL = 120000; // 2 min
  private inflightBatch: Promise<Record<string, TokenPrice>> | null = null;

  // Map our token symbols to Binance trading pairs
  private symbolMap: Record<string, string> = {
    ETH: 'ETHUSDT',
    BTC: 'BTCUSDT',
    USDT: 'USDTDAI',
    USDC: 'USDCUSDT',
    DAI: 'DAIUSDT',
    BNB: 'BNBUSDT',
    SOL: 'SOLUSDT',
    MATIC: 'MATICUSDT',
  };

  // Map our token symbols to CoinGecko IDs
  private coingeckoMap: Record<string, string> = {
    ETH: 'ethereum',
    BTC: 'bitcoin',
    BNB: 'binancecoin',
    SOL: 'solana',
    MATIC: 'matic-network',
  };

  // Stablecoins are always ~$1
  private stablecoins = ['USDT', 'USDC', 'DAI'];

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY || '';
  }

  private async fetchFromTwelveData(symbols: string[]): Promise<Record<string, TokenPrice>> {
    if (!this.twelveDataKey) return {};
    const pairs = symbols
      .filter(s => !this.stablecoins.includes(s.toUpperCase()))
      .map(s => `${s.toUpperCase()}/USD`);
    if (pairs.length === 0) return {};

    const response = await axios.get(`${this.twelveDataUrl}/price`, {
      params: { symbol: pairs.join(','), apikey: this.twelveDataKey },
      timeout: 7000,
    });

    const data = response.data;
    const result: Record<string, TokenPrice> = {};
    for (const sym of symbols) {
      const upper = sym.toUpperCase();
      const key = `${upper}/USD`;
      const entry = data[key] || (pairs.length === 1 ? data : null);
      const priceStr = entry?.price;
      if (priceStr) {
        result[upper] = {
          symbol: upper,
          price: parseFloat(priceStr),
          change24h: 0,
          volume24h: 0,
          lastUpdated: Date.now(),
        };
      }
    }
    return result;
  }

  private async fetchFromCoinGecko(symbols: string[]): Promise<Record<string, TokenPrice>> {
    const ids = symbols
      .map(s => this.coingeckoMap[s.toUpperCase()])
      .filter(Boolean)
      .join(',');
    if (!ids) return {};

    const response = await axios.get(`${this.coingeckoUrl}/simple/price`, {
      params: {
        ids,
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_24hr_vol: 'true',
      },
      timeout: 7000,
    });

    const result: Record<string, TokenPrice> = {};
    for (const sym of symbols) {
      const id = this.coingeckoMap[sym.toUpperCase()];
      const entry = id && response.data[id];
      if (entry) {
        result[sym.toUpperCase()] = {
          symbol: sym.toUpperCase(),
          price: entry.usd ?? 0,
          change24h: entry.usd_24h_change ?? 0,
          volume24h: entry.usd_24h_vol ?? 0,
          lastUpdated: Date.now(),
        };
      }
    }
    return result;
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

    if (!this.coingeckoMap[upperSymbol] && !this.symbolMap[upperSymbol]) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    // Try CoinGecko first (not geo-blocked on Render)
    try {
      const cg = await this.fetchFromCoinGecko([upperSymbol]);
      if (cg[upperSymbol]) {
        this.priceCache.set(upperSymbol, { price: cg[upperSymbol], cachedAt: Date.now() });
        logger.info(`Fetched ${upperSymbol} price (CoinGecko): $${cg[upperSymbol].price}`);
        return cg[upperSymbol];
      }
    } catch (error: any) {
      logger.warn(`CoinGecko failed for ${upperSymbol}: ${error.message}`);
    }

    // Fallback: Twelve Data
    try {
      const td = await this.fetchFromTwelveData([upperSymbol]);
      if (td[upperSymbol]) {
        this.priceCache.set(upperSymbol, { price: td[upperSymbol], cachedAt: Date.now() });
        logger.info(`Fetched ${upperSymbol} price (Twelve Data): $${td[upperSymbol].price}`);
        return td[upperSymbol];
      }
    } catch (error: any) {
      logger.warn(`Twelve Data failed for ${upperSymbol}: ${error.message}`);
    }

    // Fallback: Binance (works locally, blocked on Render)
    const binancePair = this.symbolMap[upperSymbol];
    if (binancePair) {
      try {
        const response = await axios.get<BinanceTickerResponse>(
          `${this.binanceUrl}/api/v3/ticker/24hr`,
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
        logger.info(`Fetched ${upperSymbol} price (Binance): $${tokenPrice.price}`);
        return tokenPrice;
      } catch (error: any) {
        logger.warn(`Binance failed for ${upperSymbol}: ${error.message}`);
      }
    }

    // Last resort: stale cache or hardcoded fallback
    if (cached) return cached.price;
    return this.getFallbackPrice(upperSymbol);
  }

  async getAllPrices(): Promise<TokenPrice[]> {
    const symbols = Object.keys(this.symbolMap);
    const nonStable = symbols.filter(s => !this.stablecoins.includes(s));
    const now = Date.now();

    // If all non-stable prices are cached and fresh, return immediately — no API hit
    const allFresh = nonStable.every(s => {
      const c = this.priceCache.get(s);
      return c && now - c.cachedAt < this.cacheTTL;
    });

    if (!allFresh) {
      // Dedupe concurrent callers onto one in-flight batch request
      if (!this.inflightBatch) {
        this.inflightBatch = (async () => {
          // Try CoinGecko first
          try {
            const batch = await this.fetchFromCoinGecko(nonStable);
            if (Object.keys(batch).length > 0) {
              for (const [sym, price] of Object.entries(batch)) {
                this.priceCache.set(sym, { price, cachedAt: Date.now() });
              }
              return batch;
            }
          } catch (error: any) {
            logger.warn(`CoinGecko batch failed: ${error.message}`);
          }

          // Fallback: Twelve Data
          try {
            const batch = await this.fetchFromTwelveData(nonStable);
            if (Object.keys(batch).length > 0) {
              for (const [sym, price] of Object.entries(batch)) {
                this.priceCache.set(sym, { price, cachedAt: Date.now() });
              }
              logger.info(`Fetched batch prices (Twelve Data)`);
              return batch;
            }
          } catch (error: any) {
            logger.warn(`Twelve Data batch failed: ${error.message}`);
          }

          return {};
        })().finally(() => {
          this.inflightBatch = null;
        });
      }
      await this.inflightBatch;
    }

    return symbols.map(s => {
      const upper = s.toUpperCase();
      if (this.stablecoins.includes(upper)) {
        return { symbol: upper, price: 1, change24h: 0, volume24h: 0, lastUpdated: Date.now() };
      }
      const cached = this.priceCache.get(upper);
      if (cached) return cached.price;
      return this.getFallbackPrice(upper);
    });
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

  async getKlines(symbol: string, interval: string = '1d', limit: number = 30): Promise<any[]> {
    const upperSymbol = symbol.toUpperCase();

    // Stablecoins don't have meaningful price charts
    if (this.stablecoins.includes(upperSymbol)) {
      const now = Date.now();
      return Array.from({ length: limit }, (_, i) => ({
        time: now - (limit - i) * 86400000,
        open: 1, high: 1.001, low: 0.999, close: 1, volume: 0,
      }));
    }

    const cgId = this.coingeckoMap[upperSymbol];
    const days = interval === '1h' ? 1 : interval === '4h' ? 7 : 30;

    // Try CoinGecko first
    if (cgId) {
      try {
        const response = await axios.get(`${this.coingeckoUrl}/coins/${cgId}/market_chart`, {
          params: { vs_currency: 'usd', days },
          timeout: 8000,
        });
        const prices: [number, number][] = response.data.prices || [];
        const volumes: [number, number][] = response.data.total_volumes || [];
        return prices.slice(-limit).map(([time, price], i) => ({
          time,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volumes[i]?.[1] ?? 0,
        }));
      } catch (error: any) {
        logger.warn(`CoinGecko klines failed for ${upperSymbol}: ${error.message}`);
      }
    }

    // Fallback to Binance
    const binancePair = this.symbolMap[upperSymbol];
    if (!binancePair) return [];

    try {
      const response = await axios.get(`${this.binanceUrl}/api/v3/klines`, {
        params: { symbol: binancePair, interval, limit },
        headers: this.apiKey ? { 'X-MBX-APIKEY': this.apiKey } : {},
        timeout: 5000,
      });

      return response.data.map((k: any[]) => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
    } catch (error: any) {
      logger.warn(`Binance klines failed for ${upperSymbol}: ${error.message}`);
      return [];
    }
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
