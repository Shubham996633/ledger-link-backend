import { Repository, DataSource } from 'typeorm';
import { Transaction } from '@/entities/Transaction';
import { Wallet } from '@/entities/Wallet';
import { logger } from '@/utils/logger';

interface AnomalyResult {
  isAnomaly: boolean;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  aiAnalysis: string;
  recommendations: string[];
}

interface TransactionInsight {
  category: string;
  summary: string;
  patterns: string[];
  suggestions: string[];
}

interface AddressRiskProfile {
  address: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalTransactions: number;
  totalVolume: string;
  flags: string[];
  aiSummary: string;
}

interface PortfolioInsight {
  summary: string;
  diversificationScore: number;
  topHoldings: { token: string; percentage: number }[];
  recommendations: string[];
}

/**
 * AIService - Provides AI-powered analytics for blockchain transactions
 * Uses Groq API (primary) with Gemini as fallback
 */
export class AIService {
  private transactionRepository: Repository<Transaction>;
  private walletRepository: Repository<Wallet>;
  private groqApiKey: string;
  private groqApiKey2: string;
  private geminiApiKey: string;
  private currentGroqKey: number = 1;

  constructor(private dataSource: DataSource) {
    this.transactionRepository = dataSource.getRepository(Transaction);
    this.walletRepository = dataSource.getRepository(Wallet);
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.groqApiKey2 = process.env.GROQ_API_KEY_2 || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Call Groq API with automatic key rotation and Gemini fallback
   */
  private async callAI(prompt: string, systemPrompt: string): Promise<string> {
    // Try Groq first (with key rotation)
    try {
      const result = await this.callGroq(prompt, systemPrompt);
      return result;
    } catch (groqError) {
      logger.warn('Groq API failed, trying fallback...', groqError);
    }

    // Fallback to Gemini
    try {
      const result = await this.callGemini(prompt, systemPrompt);
      return result;
    } catch (geminiError) {
      logger.error('All AI APIs failed:', geminiError);
      throw new Error('AI service unavailable');
    }
  }

  private async callGroq(prompt: string, systemPrompt: string): Promise<string> {
    const apiKey = this.currentGroqKey === 1 ? this.groqApiKey : this.groqApiKey2;
    if (!apiKey) throw new Error('No Groq API key configured');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      // Rotate key on failure
      this.currentGroqKey = this.currentGroqKey === 1 ? 2 : 1;
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.choices[0]?.message?.content || '{}';
  }

  private async callGemini(prompt: string, systemPrompt: string): Promise<string> {
    if (!this.geminiApiKey) throw new Error('No Gemini API key configured');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${prompt}\n\nRespond with valid JSON only.` }],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }

  /**
   * Analyze a transaction for anomalies and fraud
   */
  async analyzeTransaction(transactionId: string): Promise<AnomalyResult> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error('Transaction not found');

    // Get historical context
    const recentTxs = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.from_address = :addr OR tx.to_address = :addr', { addr: transaction.fromAddress })
      .orderBy('tx.created_at', 'DESC')
      .take(20)
      .getMany();

    // Calculate basic stats for context
    const amounts = recentTxs.map(tx => parseFloat(tx.amount));
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
    const maxAmount = Math.max(...amounts, 0);
    const txCount = recentTxs.length;
    const currentAmount = parseFloat(transaction.amount);

    // Rule-based pre-screening
    const flags: string[] = [];
    let baseRiskScore = 0;

    if (currentAmount > avgAmount * 5 && avgAmount > 0) {
      flags.push('Amount is 5x above average');
      baseRiskScore += 30;
    }
    if (currentAmount > maxAmount * 2 && maxAmount > 0) {
      flags.push('Amount exceeds 2x historical maximum');
      baseRiskScore += 20;
    }
    if (txCount > 10) {
      const recentCount = recentTxs.filter(tx => {
        const diff = Date.now() - new Date(tx.createdAt).getTime();
        return diff < 3600000; // last hour
      }).length;
      if (recentCount > 5) {
        flags.push('High frequency: >5 transactions in last hour');
        baseRiskScore += 25;
      }
    }

    // AI analysis
    const systemPrompt = `You are a blockchain security analyst for the Ledger Link platform. Analyze transactions for potential fraud, anomalies, and risks. Always respond in JSON format with keys: isAnomaly (boolean), riskScore (0-100), riskLevel (low/medium/high/critical), analysis (string), recommendations (array of strings).`;

    const prompt = `Analyze this blockchain transaction:
- Amount: ${transaction.amount} ${transaction.tokenSymbol}
- From: ${transaction.fromAddress}
- To: ${transaction.toAddress}
- Status: ${transaction.status}
- Time: ${transaction.createdAt}
- Historical avg amount for this address: ${avgAmount.toFixed(4)} ${transaction.tokenSymbol}
- Historical max amount: ${maxAmount.toFixed(4)} ${transaction.tokenSymbol}
- Total transactions by this address: ${txCount}
- Pre-screening flags: ${flags.length > 0 ? flags.join(', ') : 'None'}
- Base risk score from rules: ${baseRiskScore}/100

Provide fraud analysis and risk assessment.`;

    try {
      const aiResponse = await this.callAI(prompt, systemPrompt);
      const parsed = JSON.parse(aiResponse);

      return {
        isAnomaly: parsed.isAnomaly || baseRiskScore > 50,
        riskScore: Math.min(100, Math.max(parsed.riskScore || baseRiskScore, baseRiskScore)),
        riskLevel: this.getRiskLevel(parsed.riskScore || baseRiskScore),
        flags,
        aiAnalysis: parsed.analysis || 'Analysis complete',
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      // Fallback to rule-based only
      return {
        isAnomaly: baseRiskScore > 50,
        riskScore: baseRiskScore,
        riskLevel: this.getRiskLevel(baseRiskScore),
        flags,
        aiAnalysis: 'Rule-based analysis (AI unavailable)',
        recommendations: flags.length > 0 ? ['Review flagged transaction manually'] : ['No issues detected'],
      };
    }
  }

  /**
   * Get spending insights for a user
   */
  async getSpendingInsights(userId: string): Promise<TransactionInsight> {
    const transactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.user_id = :userId', { userId })
      .orderBy('tx.created_at', 'DESC')
      .take(50)
      .getMany();

    if (transactions.length === 0) {
      return {
        category: 'new_user',
        summary: 'No transactions yet. Start by creating a wallet and making your first transaction.',
        patterns: [],
        suggestions: ['Create a simulated wallet', 'Use the faucet to get test tokens', 'Try sending a transaction'],
      };
    }

    // Calculate stats
    const totalSent = transactions
      .filter(tx => tx.userId === userId)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const tokenBreakdown: Record<string, number> = {};
    transactions.forEach(tx => {
      tokenBreakdown[tx.tokenSymbol] = (tokenBreakdown[tx.tokenSymbol] || 0) + parseFloat(tx.amount);
    });

    const dailyVolumes: Record<string, number> = {};
    transactions.forEach(tx => {
      const day = new Date(tx.createdAt).toISOString().split('T')[0];
      dailyVolumes[day] = (dailyVolumes[day] || 0) + parseFloat(tx.amount);
    });

    const systemPrompt = `You are a financial advisor for the Ledger Link blockchain platform. Analyze user transaction patterns and provide helpful insights. Respond in JSON with keys: category (string), summary (string), patterns (array of strings), suggestions (array of strings).`;

    const prompt = `Analyze spending patterns for a blockchain user:
- Total transactions: ${transactions.length}
- Total volume sent: ${totalSent.toFixed(4)}
- Token breakdown: ${JSON.stringify(tokenBreakdown)}
- Daily volumes (last 7 days): ${JSON.stringify(Object.fromEntries(Object.entries(dailyVolumes).slice(-7)))}
- Most used token: ${Object.entries(tokenBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
- Average transaction: ${(totalSent / transactions.length).toFixed(4)}

Provide spending insights and suggestions.`;

    try {
      const aiResponse = await this.callAI(prompt, systemPrompt);
      return JSON.parse(aiResponse);
    } catch (error) {
      return {
        category: 'active_user',
        summary: `You've made ${transactions.length} transactions with a total volume of ${totalSent.toFixed(4)}. Most active token: ${Object.entries(tokenBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'ETH'}.`,
        patterns: [`Average transaction: ${(totalSent / transactions.length).toFixed(4)}`],
        suggestions: ['Diversify across tokens', 'Monitor gas costs'],
      };
    }
  }

  /**
   * Get risk profile for an address
   */
  async getAddressRiskProfile(address: string): Promise<AddressRiskProfile> {
    const transactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.from_address = :addr OR tx.to_address = :addr', { addr: address })
      .orderBy('tx.created_at', 'DESC')
      .take(100)
      .getMany();

    const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const sentCount = transactions.filter(tx => tx.fromAddress === address).length;
    const receivedCount = transactions.filter(tx => tx.toAddress === address).length;

    // Unique counterparties
    const counterparties = new Set<string>();
    transactions.forEach(tx => {
      if (tx.fromAddress === address) counterparties.add(tx.toAddress);
      else counterparties.add(tx.fromAddress);
    });

    // Rule-based scoring
    const flags: string[] = [];
    let riskScore = 0;

    if (sentCount > 0 && receivedCount === 0) {
      flags.push('Send-only address (no incoming)');
      riskScore += 15;
    }
    if (counterparties.size === 1 && transactions.length > 5) {
      flags.push('Single counterparty with many transactions');
      riskScore += 10;
    }
    const amounts = transactions.map(tx => parseFloat(tx.amount));
    const stdDev = this.calculateStdDev(amounts);
    if (stdDev > totalVolume / transactions.length * 3) {
      flags.push('High amount variance');
      riskScore += 15;
    }

    const systemPrompt = `You are a blockchain address risk analyst. Evaluate the risk profile of a blockchain address based on its transaction history. Respond in JSON with keys: riskScore (0-100), riskLevel (low/medium/high/critical), summary (string).`;

    const prompt = `Evaluate risk for address ${address.slice(0, 10)}...:
- Total transactions: ${transactions.length}
- Sent: ${sentCount}, Received: ${receivedCount}
- Total volume: ${totalVolume.toFixed(4)}
- Unique counterparties: ${counterparties.size}
- Rule-based flags: ${flags.join(', ') || 'None'}
- Base risk score: ${riskScore}`;

    let aiSummary = 'Analysis based on transaction patterns';
    try {
      const aiResponse = await this.callAI(prompt, systemPrompt);
      const parsed = JSON.parse(aiResponse);
      riskScore = Math.max(riskScore, parsed.riskScore || 0);
      aiSummary = parsed.summary || aiSummary;
    } catch (error) {
      // Use rule-based only
    }

    return {
      address,
      riskScore: Math.min(100, riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      totalTransactions: transactions.length,
      totalVolume: totalVolume.toFixed(4),
      flags,
      aiSummary,
    };
  }

  /**
   * Batch fraud detection on recent transactions
   */
  async detectFraud(limit: number = 50): Promise<{ flagged: AnomalyResult[]; scanned: number }> {
    const transactions = await this.transactionRepository.find({
      where: { isSimulated: true, status: 'confirmed' },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const flagged: AnomalyResult[] = [];

    for (const tx of transactions) {
      try {
        const result = await this.analyzeTransaction(tx.id);
        if (result.isAnomaly || result.riskScore > 40) {
          flagged.push(result);
        }
      } catch (error) {
        // Skip failed analysis
      }
    }

    return { flagged, scanned: transactions.length };
  }

  /**
   * Get AI-powered portfolio insights
   */
  async getPortfolioInsights(userId: string): Promise<PortfolioInsight> {
    const wallets = await this.walletRepository.find({
      where: { userId },
      relations: ['balances'],
    });

    if (wallets.length === 0) {
      return {
        summary: 'No wallets found. Create a wallet to get started.',
        diversificationScore: 0,
        topHoldings: [],
        recommendations: ['Create your first wallet'],
      };
    }

    // Aggregate balances across wallets
    const holdings: Record<string, number> = {};
    wallets.forEach(wallet => {
      (wallet as any).balances?.forEach((balance: any) => {
        holdings[balance.tokenSymbol] = (holdings[balance.tokenSymbol] || 0) + parseFloat(balance.balance);
      });
    });

    const totalValue = Object.values(holdings).reduce((a, b) => a + b, 0);
    const topHoldings = Object.entries(holdings)
      .sort(([,a], [,b]) => b - a)
      .map(([token, amount]) => ({
        token,
        percentage: totalValue > 0 ? Math.round((amount / totalValue) * 100) : 0,
      }));

    // Diversification: higher score if more evenly distributed
    const diversificationScore = topHoldings.length > 1
      ? Math.round(100 - (topHoldings[0]?.percentage || 100) + (topHoldings.length * 10))
      : 10;

    const systemPrompt = `You are a crypto portfolio advisor. Analyze portfolio composition and provide actionable advice. Respond in JSON with keys: summary (string), recommendations (array of strings).`;

    const prompt = `Portfolio analysis:
- Wallets: ${wallets.length}
- Holdings: ${JSON.stringify(holdings)}
- Top holding: ${topHoldings[0]?.token || 'None'} at ${topHoldings[0]?.percentage || 0}%
- Diversification score: ${diversificationScore}/100`;

    try {
      const aiResponse = await this.callAI(prompt, systemPrompt);
      const parsed = JSON.parse(aiResponse);

      return {
        summary: parsed.summary || `Portfolio across ${wallets.length} wallets with ${Object.keys(holdings).length} tokens`,
        diversificationScore: Math.min(100, diversificationScore),
        topHoldings,
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      return {
        summary: `Portfolio across ${wallets.length} wallets with ${Object.keys(holdings).length} tokens`,
        diversificationScore: Math.min(100, diversificationScore),
        topHoldings,
        recommendations: ['Diversify across more tokens for lower risk'],
      };
    }
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
}
