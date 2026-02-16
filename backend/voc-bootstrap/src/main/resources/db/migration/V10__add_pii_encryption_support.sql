-- PII Encryption Support
-- Increase column lengths for encrypted data (Base64 encoded AES-GCM output)
ALTER TABLE vocs ALTER COLUMN customer_email TYPE VARCHAR(512);
ALTER TABLE vocs ALTER COLUMN customer_name TYPE VARCHAR(512);
ALTER TABLE vocs ALTER COLUMN customer_phone TYPE VARCHAR(512);

-- Email hash column for searchability
ALTER TABLE vocs ADD COLUMN customer_email_hash VARCHAR(64);
CREATE INDEX idx_vocs_customer_email_hash ON vocs(customer_email_hash);
