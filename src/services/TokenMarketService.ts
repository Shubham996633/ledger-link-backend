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
  private klinesCache: Map<string, { data: any[]; cachedAt: number }> = new Map();
  private cacheTTL = 120000; // 2 min
  private klinesTTL = 600000; // 10 min — charts don't need sub-minute freshness
  private inflightBatch: Promise<Record<string, TokenPrice>> | null = null;
  private inflightKlines: Map<string, Promise<any[]>> = new Map();

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

  // Render IPs are geo-blocked by Binance, but locally Binance is the most reliable.
  // PRICE_SOURCE_ORDER env var overrides; otherwise auto-detect.
  private isHostedOnRender = !!(process.env.RENDER || process.env.RENDER_EXTERNAL_URL);

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
    this.twelveDataKey = process.env.TWELVE_DATA_API_KEY || '';
  }

  private getSourceOrder(): Array<'binance' | 'coingecko' | 'twelvedata'> {
    const override = process.env.PRICE_SOURCE_ORDER;
    if (override) {
      return override.split(',').map(s => s.trim().toLowerCase()) as any;
    }
    return this.isHostedOnRender
      ? ['twelvedata', 'coingecko', 'binance']
      : ['binance', 'coingecko', 'twelvedata'];
  }

  private async fetchFromBinance(symbols: string[]): Promise<Record<string, TokenPrice>> {
    const result: Record<string, TokenPrice> = {};
    await Promise.all(symbols.map(async sym => {
      const upper = sym.toUpperCase();
      const pair = this.symbolMap[upper];
      if (!pair) return;
      try {
        const response = await axios.get<BinanceTickerResponse>(
          `${this.binanceUrl}/api/v3/ticker/24hr`,
          {
            params: { symbol: pair },
            headers: this.apiKey ? { 'X-MBX-APIKEY': this.apiKey } : {},
            timeout: 5000,
          }
        );
        result[upper] = {
          symbol: upper,
          price: parseFloat(response.data.lastPrice),
          change24h: parseFloat(response.data.priceChangePercent),
          volume24h: parseFloat(response.data.volume),
          lastUpdated: Date.now(),
        };
      } catch {
        // swallow per-symbol error; logged at batch level
      }
    }));
    return result;
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

    for (const source of this.getSourceOrder()) {
      try {
        let result: Record<string, TokenPrice> = {};
        if (source === 'binance') result = await this.fetchFromBinance([upperSymbol]);
        else if (source === 'coingecko') result = await this.fetchFromCoinGecko([upperSymbol]);
        else if (source === 'twelvedata') result = await this.fetchFromTwelveData([upperSymbol]);

        if (result[upperSymbol]) {
          this.priceCache.set(upperSymbol, { price: result[upperSymbol], cachedAt: Date.now() });
          logger.info(`Fetched ${upperSymbol} price (${source}): $${result[upperSymbol].price}`);
          return result[upperSymbol];
        }
      } catch (error: any) {
        logger.warn(`${source} failed for ${upperSymbol}: ${error.message}`);
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
          for (const source of this.getSourceOrder()) {
            try {
              let batch: Record<string, TokenPrice> = {};
              if (source === 'binance') batch = await this.fetchFromBinance(nonStable);
              else if (source === 'coingecko') batch = await this.fetchFromCoinGecko(nonStable);
              else if (source === 'twelvedata') batch = await this.fetchFromTwelveData(nonStable);

              if (Object.keys(batch).length > 0) {
                for (const [sym, price] of Object.entries(batch)) {
                  this.priceCache.set(sym, { price, cachedAt: Date.now() });
                }
                logger.info(`Fetched batch prices (${source})`);
                return batch;
              }
            } catch (error: any) {
              logger.warn(`${source} batch failed: ${error.message}`);
            }
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
    const cacheKey = `${upperSymbol}-${interval}-${limit}`;
    const now = Date.now();

    // Cache check
    const cached = this.klinesCache.get(cacheKey);
    if (cached && now - cached.cachedAt < this.klinesTTL) {
      return cached.data;
    }

    // Stablecoins: synthetic flat chart
    if (this.stablecoins.includes(upperSymbol)) {
      const data = Array.from({ length: limit }, (_, i) => ({
        time: now - (limit - i) * 86400000,
        open: 1, high: 1.001, low: 0.999, close: 1, volume: 0,
      }));
      this.klinesCache.set(cacheKey, { data, cachedAt: now });
      return data;
    }

    // Dedupe concurrent requests for the same key
    const existing = this.inflightKlines.get(cacheKey);
    if (existing) return existing;

    const promise = this.fetchKlines(upperSymbol, interval, limit).then(data => {
      if (data.length > 0) {
        this.klinesCache.set(cacheKey, { data, cachedAt: Date.now() });
      } else if (cached) {
        // All sources failed — return stale cache if we have it
        return cached.data;
      }
      return data;
    }).finally(() => {
      this.inflightKlines.delete(cacheKey);
    });

    this.inflightKlines.set(cacheKey, promise);
    return promise;
  }

  private async fetchKlines(upperSymbol: string, interval: string, limit: number): Promise<any[]> {
    for (const source of this.getSourceOrder()) {
      try {
        if (source === 'binance') {
          const pair = this.symbolMap[upperSymbol];
          if (!pair) continue;
          const response = await axios.get(`${this.binanceUrl}/api/v3/klines`, {
            params: { symbol: pair, interval, limit },
            headers: this.apiKey ? { 'X-MBX-APIKEY': this.apiKey } : {},
            timeout: 5000,
          });
          return response.data.map((k: any[]) => ({
            time: k[0],
            open: parseFloat(k[1]), high: parseFloat(k[2]),
            low: parseFloat(k[3]), close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));
        }

        if (source === 'coingecko') {
          const cgId = this.coingeckoMap[upperSymbol];
          if (!cgId) continue;
          const days = interval === '1h' ? 1 : interval === '4h' ? 7 : 30;
          const response = await axios.get(`${this.coingeckoUrl}/coins/${cgId}/market_chart`, {
            params: { vs_currency: 'usd', days },
            timeout: 8000,
          });
          const prices: [number, number][] = response.data.prices || [];
          const volumes: [number, number][] = response.data.total_volumes || [];
          if (prices.length > 0) {
            return prices.slice(-limit).map(([time, price], i) => ({
              time, open: price, high: price, low: price, close: price,
              volume: volumes[i]?.[1] ?? 0,
            }));
          }
        }

        if (source === 'twelvedata' && this.twelveDataKey) {
          const tdInterval = interval === '1h' ? '1h' : interval === '4h' ? '4h' : '1day';
          const response = await axios.get(`${this.twelveDataUrl}/time_series`, {
            params: {
              symbol: `${upperSymbol}/USD`,
              interval: tdInterval,
              outputsize: limit,
              apikey: this.twelveDataKey,
            },
            timeout: 8000,
          });
          const values: any[] = response.data.values || [];
          if (values.length > 0) {
            return values.slice().reverse().map(v => ({
              time: new Date(v.datetime).getTime(),
              open: parseFloat(v.open), high: parseFloat(v.high),
              low: parseFloat(v.low), close: parseFloat(v.close),
              volume: parseFloat(v.volume || '0'),
            }));
          }
        }
      } catch (error: any) {
        logger.warn(`${source} klines failed for ${upperSymbol}: ${error.message}`);
      }
    }

    return [];
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
