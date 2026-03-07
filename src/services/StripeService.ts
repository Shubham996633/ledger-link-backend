import Stripe from 'stripe';
import { DataSource, Repository } from 'typeorm';
import { TokenPurchase } from '@/entities/TokenPurchase';
import { TokenMarketService } from './TokenMarketService';
import { SimulatedWalletService } from './SimulatedWalletService';
import { logger } from '@/utils/logger';

export class StripeService {
  private stripe: Stripe;
  private purchaseRepo: Repository<TokenPurchase>;
  private marketService: TokenMarketService;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      logger.warn('STRIPE_SECRET_KEY not set - Stripe payments disabled');
    }
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2025-02-24.acacia' as any,
    });
    this.dataSource = dataSource;
    this.purchaseRepo = dataSource.getRepository(TokenPurchase);
    this.marketService = new TokenMarketService();
  }

  async createCheckoutSession(params: {
    userId: string;
    walletId: string;
    tokenSymbol: string;
    usdAmount: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const { userId, walletId, tokenSymbol, usdAmount, successUrl, cancelUrl } = params;

    if (usdAmount < 1 || usdAmount > 10000) {
      throw new Error('Amount must be between $1 and $10,000');
    }

    // Get current token price
    const tokenPrice = await this.marketService.getPrice(tokenSymbol);
    const tokenAmount = this.marketService.calculateTokenAmount(usdAmount, tokenPrice.price);

    // Create Stripe Checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tokenAmount.slice(0, 10)} ${tokenSymbol} Tokens`,
              description: `Purchase ${tokenSymbol} at $${tokenPrice.price.toFixed(2)} per token`,
            },
            unit_amount: Math.round(usdAmount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        walletId,
        tokenSymbol,
        tokenAmount,
        priceAtPurchase: tokenPrice.price.toString(),
      },
    });

    // Store purchase record
    const purchase = this.purchaseRepo.create({
      userId,
      walletId,
      stripeSessionId: session.id,
      usdAmount: usdAmount.toString(),
      tokenSymbol,
      tokenAmount,
      priceAtPurchase: tokenPrice.price.toString(),
      status: 'pending',
      metadata: {
        binancePrice: tokenPrice.price,
        change24h: tokenPrice.change24h,
      },
    });
    await this.purchaseRepo.save(purchase);

    logger.info(`Checkout session created: ${session.id} for ${tokenAmount} ${tokenSymbol}`);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    if (webhookSecret) {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      // In test mode without webhook secret, parse directly
      event = JSON.parse(payload.toString()) as Stripe.Event;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.fulfillPurchase(session);
    }
  }

  async verifyAndFulfill(sessionId: string): Promise<TokenPurchase> {
    // Retrieve session from Stripe to verify payment
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const purchase = await this.purchaseRepo.findOne({
      where: { stripeSessionId: sessionId },
    });

    if (!purchase) {
      throw new Error('Purchase record not found');
    }

    if (purchase.status === 'completed') {
      return purchase; // Already fulfilled
    }

    // Credit tokens to wallet
    const walletService = new SimulatedWalletService(this.dataSource);
    await walletService.addBalance(
      purchase.walletId,
      purchase.tokenSymbol,
      purchase.tokenAmount
    );

    // Update purchase status
    purchase.status = 'completed';
    purchase.stripePaymentIntent = session.payment_intent as string;
    await this.purchaseRepo.save(purchase);

    logger.info(`Purchase fulfilled: ${purchase.tokenAmount} ${purchase.tokenSymbol} to wallet ${purchase.walletId}`);

    return purchase;
  }

  private async fulfillPurchase(session: Stripe.Checkout.Session): Promise<void> {
    try {
      await this.verifyAndFulfill(session.id);
    } catch (error) {
      logger.error(`Failed to fulfill purchase for session ${session.id}:`, error);
    }
  }

  async getUserPurchases(userId: string, limit = 20, offset = 0): Promise<{ purchases: TokenPurchase[]; total: number }> {
    const [purchases, total] = await this.purchaseRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { purchases, total };
  }

  async getPurchaseStats(userId: string): Promise<any> {
    const result = await this.purchaseRepo
      .createQueryBuilder('p')
      .where('p.user_id = :userId AND p.status = :status', { userId, status: 'completed' })
      .select([
        'COUNT(*) as "totalPurchases"',
        'COALESCE(SUM(CAST(p.usd_amount AS NUMERIC)), 0) as "totalSpent"',
      ])
      .getRawOne();

    return {
      totalPurchases: parseInt(result.totalPurchases) || 0,
      totalSpent: parseFloat(result.totalSpent) || 0,
    };
  }
}
