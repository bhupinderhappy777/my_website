-- Migration to add new client fields for tax residency, investments, banking, and approval documentation
-- Run this in your Supabase SQL editor or database console

-- Add tax_residency as text array (default to ['Canada'])
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_residency text[] DEFAULT ARRAY['Canada'];

-- Add investments as text array
ALTER TABLE clients ADD COLUMN IF NOT EXISTS investments text[];

-- Banking details fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_transit text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_institution text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_address text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_city text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_province text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_postal_code text;

-- Approval documentation fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS approval_documents text[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_number text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_jurisdiction text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_expiry date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS citizenship text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS citizenship_other text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_verified_physical boolean DEFAULT false;

-- Create GIN indexes for array columns to enable efficient membership queries
CREATE INDEX IF NOT EXISTS idx_clients_tax_residency ON clients USING GIN (tax_residency);
CREATE INDEX IF NOT EXISTS idx_clients_investments ON clients USING GIN (investments);
CREATE INDEX IF NOT EXISTS idx_clients_approval_documents ON clients USING GIN (approval_documents);

-- Optional: Update existing records to have default tax_residency if null
-- UPDATE clients SET tax_residency = ARRAY['Canada'] WHERE tax_residency IS NULL;