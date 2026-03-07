-- =====================================================
-- Create Payment Requests Table
-- Run this to manually create the payment_requests table
-- =====================================================

-- Create the table
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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payment_requests'
ORDER BY ordinal_position;
