-- =====================================================
-- Add Blocks Table (Blockchain Engine)
-- =====================================================

CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number INTEGER UNIQUE NOT NULL,
    hash VARCHAR(255) UNIQUE NOT NULL,
    previous_hash VARCHAR(255) NOT NULL,
    merkle_root VARCHAR(255),
    timestamp BIGINT NOT NULL,
    nonce INTEGER DEFAULT 0,
    difficulty INTEGER DEFAULT 1,
    gas_used DECIMAL(36, 18) DEFAULT 0,
    gas_limit DECIMAL(36, 18) DEFAULT 0,
    miner VARCHAR(255),
    validator VARCHAR(255),
    size INTEGER DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    confirmations INTEGER DEFAULT 0,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocks_block_number ON blocks(block_number);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
CREATE INDEX IF NOT EXISTS idx_blocks_validator ON blocks(validator);
CREATE INDEX IF NOT EXISTS idx_blocks_created_at ON blocks(created_at);
