-- =====================================================
-- Ledger Link - Database Migration SQL
-- For Simulated Wallet System
-- =====================================================

-- Run this migration if you're NOT using TypeORM's synchronize: true
-- OR if you need to set up the database manually

-- =====================================================
-- 1. CREATE WALLET_BALANCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    token_symbol VARCHAR(20) NOT NULL DEFAULT 'ETH',
    token_address VARCHAR(255),
    balance DECIMAL(36, 18) DEFAULT '0',
    decimals INTEGER DEFAULT 18,
    token_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_wallet_balance_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE CASCADE,

    -- Unique constraint - one balance per token per wallet
    CONSTRAINT uk_wallet_token UNIQUE (wallet_id, token_symbol)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet_id ON wallet_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_token_symbol ON wallet_balances(token_symbol);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_is_active ON wallet_balances(is_active);

-- =====================================================
-- 2. ALTER WALLETS TABLE
-- =====================================================

-- Add is_simulated column to wallets table
ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT TRUE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_wallets_is_simulated ON wallets(is_simulated);

-- =====================================================
-- 3. ALTER TRANSACTIONS TABLE
-- =====================================================

-- Add is_simulated column to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN DEFAULT TRUE;

-- Make block_number nullable for simulated transactions
ALTER TABLE transactions
ALTER COLUMN block_number DROP NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_transactions_is_simulated ON transactions(is_simulated);

-- =====================================================
-- 4. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to wallet_balances
DROP TRIGGER IF EXISTS update_wallet_balances_updated_at ON wallet_balances;
CREATE TRIGGER update_wallet_balances_updated_at
    BEFORE UPDATE ON wallet_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE PAYMENT_REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    wallet_id UUID NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    request_id VARCHAR(20) UNIQUE NOT NULL,
    description VARCHAR(500),
    amount DECIMAL(20, 8),
    token_symbol VARCHAR(20) NOT NULL DEFAULT 'ETH',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_by_user_id UUID,
    transaction_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_payment_request_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_request_wallet
        FOREIGN KEY (wallet_id)
        REFERENCES wallets(id)
        ON DELETE CASCADE,

    -- Check constraint for status
    CONSTRAINT chk_payment_request_status
        CHECK (status IN ('pending', 'completed', 'cancelled', 'expired'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_wallet_id ON payment_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_request_id ON payment_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_expires_at ON payment_requests(expires_at);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SEED INITIAL DATA (OPTIONAL)
-- =====================================================

-- You can run this to create demo users and wallets
-- Or use: npm run seed

-- Example: Create a demo user
-- INSERT INTO users (id, email, username, first_name, last_name, is_email_verified, role, is_active)
-- VALUES (
--     gen_random_uuid(),
--     'demo@ledgerlink.com',
--     'demo_user',
--     'Demo',
--     'User',
--     TRUE,
--     'user',
--     TRUE
-- );

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify wallet_balances table exists
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'wallet_balances'
ORDER BY ordinal_position;

-- Verify payment_requests table exists
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'payment_requests'
ORDER BY ordinal_position;

-- Verify wallet is_simulated column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'wallets' AND column_name = 'is_simulated';

-- Verify transaction is_simulated column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'is_simulated';

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('wallet_balances', 'wallets', 'transactions', 'payment_requests')
ORDER BY tablename, indexname;

-- =====================================================
-- 8. ROLLBACK (IF NEEDED)
-- =====================================================

-- Uncomment below to rollback changes

-- DROP TABLE IF EXISTS payment_requests CASCADE;
-- DROP TABLE IF EXISTS wallet_balances CASCADE;
-- ALTER TABLE wallets DROP COLUMN IF EXISTS is_simulated;
-- ALTER TABLE transactions DROP COLUMN IF EXISTS is_simulated;
-- ALTER TABLE transactions ALTER COLUMN block_number SET NOT NULL;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- NOTES:
-- =====================================================

-- For development with TypeORM synchronize: true
-- You don't need to run this migration manually
-- TypeORM will auto-create/update tables

-- For production:
-- 1. Set synchronize: false in database config
-- 2. Run this migration manually
-- 3. Or use TypeORM CLI: npm run migration:run

-- To create migrations with TypeORM:
-- npm run migration:generate -- -n AddSimulatedWallet
-- npm run migration:run
-- npm run migration:revert
