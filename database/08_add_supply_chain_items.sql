-- =====================================================
-- Add Supply Chain Items Table (Chain of Custody Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS supply_chain_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    origin VARCHAR(255),
    owner_id UUID NOT NULL,
    current_holder_id UUID,
    status VARCHAR(50) DEFAULT 'created',
    chain_of_custody JSONB DEFAULT '[]',
    checkpoints JSONB DEFAULT '[]',
    data_hash VARCHAR(255),
    blockchain_tx_hash VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_supply_chain_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_supply_chain_tracking_id ON supply_chain_items(tracking_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_owner_id ON supply_chain_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_current_holder ON supply_chain_items(current_holder_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_status ON supply_chain_items(status);
CREATE INDEX IF NOT EXISTS idx_supply_chain_created_at ON supply_chain_items(created_at);
