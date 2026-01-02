# Setup Instructions

Follow these steps to set up the new form system architecture.

## Prerequisites

- Supabase project with database access
- SQL editor access in Supabase dashboard
- Storage bucket creation permissions

## Step 1: Create Database Tables

Run the migration files in the following order:

### 1.1 Create form_templates table

```bash
# In Supabase SQL Editor, run:
migrations/create_form_templates.sql
```

This creates the `form_templates` table and seeds it with a KYC template placeholder.

### 1.2 Create kyc_collected_info table

```bash
# In Supabase SQL Editor, run:
migrations/create_kyc_collected_info.sql
```

This creates the table to store all form submissions with:
- Foreign keys to clients and form_templates
- JSONB storage for flexible form data
- Indexes for efficient queries
- Auto-update trigger for updated_at

### 1.3 Create kyc_form_pdf table

```bash
# In Supabase SQL Editor, run:
migrations/create_kyc_form_pdf.sql
```

This creates the table to track generated PDFs with links to the source data.

### 1.4 Verify existing clients table

The `clients` table should already exist. If not, ensure it has been created with all required fields as defined in:
```bash
migrations/add_client_fields.sql
```

## Step 2: Create Storage Buckets

### 2.1 Create form-templates bucket

1. Go to Storage in Supabase dashboard
2. Create new bucket: `form-templates`
3. Set as **public** (or private with auth policies)
4. Upload your KYC PDF template

### 2.2 Create generated-pdfs bucket

1. Create new bucket: `generated-pdfs`
2. Set policies:
   - **Insert:** Authenticated users can upload
   - **Select:** Authenticated users can read (or public based on requirements)

Example policies:

```sql
-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-pdfs');

-- Allow authenticated users to read PDFs
CREATE POLICY "Authenticated users can read PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'generated-pdfs');

-- Optional: Allow users to update their own PDFs
CREATE POLICY "Users can update own PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'generated-pdfs' AND auth.uid()::text = owner);

-- Optional: Allow users to delete their own PDFs
CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'generated-pdfs' AND auth.uid()::text = owner);
```

## Step 3: Update form_templates with Real PDF URL

After uploading your KYC template to the `form-templates` bucket:

1. Get the public URL from Supabase Storage
2. Update the form_templates table:

```sql
UPDATE form_templates
SET pdf_url = 'https://your-project.supabase.co/storage/v1/object/public/form-templates/kyc-template.pdf'
WHERE name = 'KYC Form';
```

## Step 4: Test the System

### 4.1 Create or select a test client

```sql
-- Insert a test client if needed
INSERT INTO clients (email, first_name, last_name)
VALUES ('test@example.com', 'Test', 'Client')
RETURNING id;
```

### 4.2 Open KYC Form

1. Navigate to `/agent/clients` in your application
2. Select the test client
3. Click to open KYC form
4. Verify the form loads (should prefill from clients table if no previous submission)

### 4.3 Submit the form

1. Fill in the form fields
2. Click "Generate PDF"
3. Verify:
   - PDF is downloaded
   - Entry created in `kyc_collected_info`
   - Entry created in `kyc_form_pdf`
   - Client info updated in `clients` table

### 4.4 Test prefill

1. Reopen the KYC form for the same client
2. Verify the form is prefilled with data from the previous submission

## Step 5: Verify Data

### 5.1 Check kyc_collected_info

```sql
SELECT 
  id,
  client_id,
  form_template_id,
  created_at,
  form_data->>'first_name' as first_name,
  form_data->>'last_name' as last_name
FROM kyc_collected_info
ORDER BY created_at DESC
LIMIT 5;
```

### 5.2 Check kyc_form_pdf

```sql
SELECT 
  id,
  client_id,
  filename,
  pdf_url,
  generated_at
FROM kyc_form_pdf
ORDER BY generated_at DESC
LIMIT 5;
```

### 5.3 Check clients table was updated

```sql
SELECT 
  id,
  first_name,
  last_name,
  email,
  tax_residency,
  investments
FROM clients
WHERE id = 'your-test-client-id';
```

## Troubleshooting

### Issue: PDF template not found

**Solution:** Verify the form_templates table has the correct pdf_url:
```sql
SELECT * FROM form_templates WHERE name ILIKE '%kyc%';
```

### Issue: Permission denied when uploading PDF

**Solution:** Check storage bucket policies allow authenticated users to insert:
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'generated-pdfs';
```

### Issue: Form doesn't prefill

**Solution:** Check if data exists in kyc_collected_info:
```sql
SELECT * FROM kyc_collected_info 
WHERE client_id = 'your-client-id' 
ORDER BY created_at DESC;
```

### Issue: Foreign key constraint violation

**Solution:** Ensure the client exists and form_template exists:
```sql
-- Check client exists
SELECT id FROM clients WHERE id = 'your-client-id';

-- Check form template exists
SELECT id FROM form_templates WHERE name = 'KYC Form';
```

## Adding a New Form Type

When you're ready to add a new form type (e.g., Account Opening Form):

1. **Upload template to storage**
   - Upload PDF to `form-templates` bucket

2. **Add to form_templates**
   ```sql
   INSERT INTO form_templates (name, pdf_url, company)
   VALUES ('Account Opening Form', 'your-storage-url', 'Your Company');
   ```

3. **Create UI component**
   - Copy `KYCForm.jsx` as template
   - Modify fields for new form type
   - Update form_template_id query

4. **Create field mapping**
   - Create `account_opening_field_mappings.json`
   - Map UI fields to PDF fields

5. **Create filler**
   - Create `accountOpeningFiller.js`
   - Follow pattern from `kycFiller.js`

The system will automatically:
- Save submissions to `kyc_collected_info`
- Update client info in `clients` table
- Generate and store PDFs in `kyc_form_pdf`
- Prefill from latest submission

## Next Steps

- [ ] Run all migration files
- [ ] Create storage buckets
- [ ] Upload KYC template
- [ ] Update form_templates with real URL
- [ ] Test with a client
- [ ] Verify data in all tables
- [ ] Set up proper RLS policies for production
- [ ] Configure backup strategy

## Production Considerations

Before deploying to production:

1. **Row Level Security (RLS)**
   - Enable RLS on all tables
   - Create policies to restrict access by user role
   - Ensure agents can only access their assigned clients

2. **Storage Security**
   - Review storage bucket policies
   - Consider private buckets with signed URLs
   - Set up file size limits

3. **Backup Strategy**
   - Enable point-in-time recovery
   - Schedule regular backups
   - Test restore procedures

4. **Monitoring**
   - Set up logging for form submissions
   - Monitor storage usage
   - Track PDF generation errors

5. **Performance**
   - Review query performance with production data volume
   - Add additional indexes if needed
   - Consider partitioning for very large datasets
