-- =====================================================
-- Add Health Records Table (Encrypted Healthcare Records)
-- =====================================================

CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    provider_id UUID,
    record_type VARCHAR(50) NOT NULL,
    encrypted_data TEXT NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    blockchain_tx_hash VARCHAR(255),
    zk_proof_id VARCHAR(255),
    access_list JSONB DEFAULT '[]',
    metadata JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_health_record_patient
        FOREIGN KEY (patient_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_provider_id ON health_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_health_records_record_type ON health_records(record_type);
CREATE INDEX IF NOT EXISTS idx_health_records_status ON health_records(status);
CREATE INDEX IF NOT EXISTS idx_health_records_created_at ON health_records(created_at);
