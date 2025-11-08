-- ========================================================
-- LEDGER LINK - COMPLETE DATABASE SETUP
-- Fresh database installation from scratch
-- ========================================================

-- Drop existing tables if you want to reset (CAUTION: DATA LOSS!)
-- Uncomment below to reset database
/*
DROP TABLE IF EXISTS wallet_balances CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
*/

-- ========================================================
-- 1. CREATE USERS TABLE
-- ========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    is_email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ========================================================
-- 2. CREATE WALLETS TABLE
-- ========================================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    network VARCHAR(50) DEFAULT 'goerli',
    is_active BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    is_simulated BOOLEAN DEFAULT TRUE,
    label VARCHAR(255),
    metadata JSONB,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_wallet_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_blockchain ON wallets(blockchain);
CREATE INDEX IF NOT EXISTS idx_wallets_network ON wallets(network);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_wallets_is_simulated ON wallets(is_simulated);

-- ========================================================
-- 3. CREATE WALLET_BALANCES TABLE
-- ========================================================

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

    -- Unique constraint
    CONSTRAINT uk_wallet_token UNIQUE (wallet_id, token_symbol)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet_id ON wallet_balances(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_token_symbol ON wallet_balances(token_symbol);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_is_active ON wallet_balances(is_active);

-- ========================================================
-- 4. CREATE TRANSACTIONS TABLE
-- ========================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    from_address VARCHAR(255) NOT NULL,
    to_address VARCHAR(255) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    token_address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    is_simulated BOOLEAN DEFAULT TRUE,
    block_number INTEGER,
    confirmations INTEGER,
    gas_used DECIMAL(36, 18),
    gas_price DECIMAL(36, 18),
    transaction_fee DECIMAL(36, 18),
    data TEXT,
    metadata JSONB,
    description TEXT,
    blockchain VARCHAR(50) DEFAULT 'ethereum',
    network VARCHAR(50) DEFAULT 'goerli',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    CONSTRAINT fk_transaction_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_is_simulated ON transactions(is_simulated);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_blockchain ON transactions(blockchain);
CREATE INDEX IF NOT EXISTS idx_transactions_network ON transactions(network);

-- ========================================================
-- 5. CREATE UPDATE TRIGGER FUNCTION
-- ========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_balances_updated_at ON wallet_balances;
CREATE TRIGGER update_wallet_balances_updated_at
    BEFORE UPDATE ON wallet_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================
-- 6. SEED DEMO DATA (OPTIONAL)
-- ========================================================

-- Create demo users
INSERT INTO users (email, username, first_name, last_name, is_email_verified, role, is_active)
VALUES
    ('alice@example.com', 'alice', 'Alice', 'Johnson', TRUE, 'user', TRUE),
    ('bob@example.com', 'bob', 'Bob', 'Smith', TRUE, 'user', TRUE),
    ('charlie@example.com', 'charlie', 'Charlie', 'Brown', TRUE, 'user', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ========================================================
-- 7. VERIFICATION QUERIES
-- ========================================================

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'wallet_balances', COUNT(*) FROM wallet_balances
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- View table structures
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('users', 'wallets', 'wallet_balances', 'transactions')
ORDER BY table_name, ordinal_position;

-- View all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('users', 'wallets', 'wallet_balances', 'transactions')
ORDER BY tablename, indexname;

-- View all foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('users', 'wallets', 'wallet_balances', 'transactions');

-- ========================================================
-- NOTES
-- ========================================================

-- To run this script:
-- 1. Connect to your PostgreSQL database
-- 2. Run: psql -U postgres -d ledger_link -f DATABASE_COMPLETE_SETUP.sql

-- To reset and start fresh:
-- 1. Uncomment the DROP statements at the top
-- 2. Run the script again

-- After setup:
-- 1. Run backend: cd backend && npm run dev
-- 2. Seed data: npm run seed
-- 3. Test API: http://localhost:3000/api-docs
