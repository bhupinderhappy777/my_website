-- ============================================================================
-- Migration: Create and Populate form_templates Table
-- ============================================================================
-- Purpose:
--   This table is the registry of all PDF form templates available in the system.
--   Each template represents a different form type (KYC, Account Opening, etc.)
--
-- Architecture Role:
--   - Acts as the "master list" of available forms
--   - Links to actual PDF template files stored in Supabase Storage
--   - Referenced by kyc_collected_info and kyc_form_pdf to identify form type
--
-- Workflow:
--   1. Upload blank PDF template to Supabase Storage bucket 'form-templates'
--   2. Insert record here with name and public URL to the template
--   3. Forms reference this table to get the template for PDF generation
--   4. When generating PDF, kycFiller.js fetches the template URL from this table
--
-- Adding New Form Types:
--   1. Create new table for collected info (or use generic kyc_collected_info)
--   2. Upload new PDF template to storage
--   3. Add row to this table with template name and URL
--   4. Create UI component for the new form type
--   5. Create filler utility to map UI fields to PDF fields
-- ============================================================================

-- Create table if it doesn't exist
create table if not exists public.form_templates (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  pdf_url text not null,
  company text null,
  created_at timestamp without time zone null default now(),
  
  constraint form_templates_pkey primary key (id),
  constraint form_templates_name_key unique (name)
) TABLESPACE pg_default;

-- Add comment to table
COMMENT ON TABLE form_templates IS 'Stores PDF form templates. Each template has a name and URL pointing to the PDF file in storage.';
COMMENT ON COLUMN form_templates.pdf_url IS 'Public URL to the PDF template file stored in Supabase Storage';
COMMENT ON COLUMN form_templates.company IS 'Optional company/organization that owns or uses this form template';

-- Create index for efficient name lookups
CREATE INDEX IF NOT EXISTS idx_form_templates_name ON form_templates (name);

-- Insert KYC form template (update the pdf_url with your actual storage URL)
-- Note: You need to upload your KYC PDF template to Supabase Storage first
-- and then update the pdf_url value here
INSERT INTO form_templates (name, pdf_url, company)
VALUES (
  'KYC Form',
  'https://your-supabase-project.supabase.co/storage/v1/object/public/form-templates/kyc-template.pdf',
  'Your Company Name'
)
ON CONFLICT (name) DO UPDATE
SET pdf_url = EXCLUDED.pdf_url,
    company = EXCLUDED.company;

-- Example: Add more form templates as needed
-- INSERT INTO form_templates (name, pdf_url, company)
-- VALUES (
--   'Account Opening Form',
--   'https://your-supabase-project.supabase.co/storage/v1/object/public/form-templates/account-opening.pdf',
--   'Your Company Name'
-- )
-- ON CONFLICT (name) DO NOTHING;
