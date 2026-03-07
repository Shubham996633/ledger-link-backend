-- =====================================================
-- Add Token Purchases Table (Stripe + Binance Integration)
-- =====================================================

CREATE TABLE IF NOT EXISTS token_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id VARCHAR(255) NOT NULL,
    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_payment_intent VARCHAR(255),
    usd_amount DECIMAL(18, 2) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    token_amount DECIMAL(36, 18) NOT NULL,
    price_at_purchase DECIMAL(18, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_stripe_session ON token_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_status ON token_purchases(status);
CREATE INDEX IF NOT EXISTS idx_token_purchases_created_at ON token_purchases(created_at);
