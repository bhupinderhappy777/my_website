# Form System Architecture Documentation

## Overview

This document describes the streamlined form system architecture for handling KYC (Know Your Client) and other form types. The system uses a modular approach with separate tables for templates, collected data, and generated PDFs.

## Database Schema

### 1. `clients` Table
Stores core client information that is relatively stable across multiple form submissions.

**Key Fields:**
- Personal info: name, email, DOB, SIN, address, phone
- Employment: employer, occupation, annual_income
- Financial: net_worth, liquid_assets, fixed_assets, liabilities
- Banking: bank details (name, transit, institution, account)
- Identity: citizenship, approval_documents, document details
- Preferences: language_preference, tax_residency, investments

**Purpose:** 
- Single source of truth for client information
- Updated automatically when forms are submitted with new/changed info
- Used as fallback for prefilling forms when no previous submission exists

### 2. `form_templates` Table
Stores metadata about PDF form templates.

```sql
- id: uuid (primary key)
- name: text (unique) - e.g., "KYC Form"
- pdf_url: text - URL to template PDF in storage
- company: text - optional company/org name
- created_at: timestamp
```

**Purpose:**
- Central registry of all available form types
- Links to PDF templates stored in Supabase Storage
- Allows easy addition of new form types

### 3. `forms` Table (Generic)
Form-agnostic storage for any submission (kyc, trade_ticket, investor_profile, etc.).

```sql
- id: uuid (primary key)
- client_id: uuid (foreign key -> clients)
- form_type: text (e.g., 'kyc')
- form_template_id: uuid (foreign key -> form_templates, nullable)
- version: int (schema/template version)
- status: text (draft/submitted/approved/...)
- data: jsonb - Complete form submission payload
- pdf_url: text - optional template or generated PDF reference
- created_by / submitted_by: uuid - optional actors
- submitted_at: timestamp
- created_at / updated_at: timestamp
```

**Purpose:**
- Single table for all form submissions
- Stores complete payloads including dynamic fields
- Used for prefilling (latest submission per client + form_type)
- Supports workflow states and template versions

**Indexes:**
- (client_id, form_type, created_at DESC) for latest-per-client queries
- GIN on data for JSONB queries

### 4. `form_events` Table
Immutable audit log for form actions.

```sql
- id: bigserial (primary key)
- form_id: uuid (foreign key -> forms)
- event_type: text (created/updated/submitted/pdf_generated/...)
- actor_id: uuid (optional)
- payload: jsonb (context/diff)
- created_at: timestamp
```

**Purpose:**
- Tracks the history of a form record without mutating the main row
- Useful for auditing submissions, approvals, PDF generations, etc.

## Workflow for Each Form Type

### Adding a New Form Type

1. **Upload Template to Storage**
   ```javascript
   // Upload PDF template to 'form-templates' bucket
   await supabase.storage
     .from('form-templates')
     .upload('new-form-template.pdf', file);
   ```

2. **Add Entry to form_templates**
   ```sql
   INSERT INTO form_templates (name, pdf_url, company)
   VALUES ('New Form Type', 'storage-url', 'Company Name');
   ```

3. **Create UI Component**
   - Create form component (e.g., `NewFormType.jsx`)
   - Use react-hook-form for form management
   - Include prefill logic (see Prefill Logic section)

4. **Create Field Mapping**
   - Create JSON mapping file (e.g., `new_form_field_mappings.json`)
   - Map UI fields to PDF field names
   - Handle checkboxes, radio buttons, arrays

5. **Create Filler Logic**
   - Create filler utility (e.g., `newFormFiller.js`)
   - Map collected data to PDF fields
   - Handle complex field logic (buttons, arrays, etc.)

### Prefill Logic

When a user opens a form for an existing client:

1. **Try to get latest submission** from `forms` with `form_type='kyc'`:
   ```javascript
   const { data } = await supabase
   .from('forms')
   .select('data')
   .eq('client_id', clientId)
   .eq('form_type', 'kyc')
     .order('created_at', { ascending: false })
     .limit(1)
     .single();
   ```

2. **If found:** Use submission data to prefill the form

3. **If not found:** Fall back to `clients` table for basic client info

4. **Parse arrays properly:**
   - tax_residency: Split into checkboxes + "other" list
   - investments: Split into standard + "other" list
   - approval_documents: Split into standard + "other" text

### Form Submission Logic

When a user submits a form:

1. **Normalize form data:**
   ```javascript
   // Expand checkbox arrays
   const finalTaxResidency = residencyArray.flatMap(item => 
     item === 'Other' ? otherCountries : item
   );
   ```

2. **Save to forms:**
   ```javascript
    const { data: savedSubmission } = await supabase
       .from('forms')
       .insert([{
          client_id: clientId,
          form_type: 'kyc',
          form_template_id: formTemplateId,
          status: 'submitted',
          data: completeFormData,
       }])
       .select()
       .single();
   ```

3. **Update clients table:**
   ```javascript
   await supabase
     .from('clients')
     .update(clientBasicInfoPayload)
     .eq('id', clientId);
   ```
   - This keeps client info current across all forms
   - Only updates basic/common fields that appear in clients table

4. **Generate PDF:**
   ```javascript
   const pdfBytes = await fillFormPDF(
     formData,
     additionalParams,
     pdfUrl,
     {
       supabase,
       clientId,
       formTemplateId,
       collectedInfoId: savedSubmission.id,
       filename,
     }
   );
   ```

5. **(Optional) Save PDF metadata:**
   - Upload PDF to storage (inside filler) if persistence is required
   - Record metadata via `forms.pdf_url` or a `form_events` entry (type `pdf_generated`)
   - Link back to the originating form via `form_id`

### PDF Generation and Storage

The filler utility handles both PDF generation and storage:

```javascript
export async function fillFormPDF(formData, params, pdfUrl, options = {}) {
  // Map form data to PDF fields
  const pdfData = mapFieldsToPDF(formData, params);
  
  // Generate PDF bytes
  const pdfBytes = await fillPDF(pdfUrl, pdfData);
  
  // If options include supabase client, save to storage
  if (options.supabase && options.clientId && options.formTemplateId) {
    // Upload to storage
    const storagePath = `form-type/${clientId}/${filename}`;
    await options.supabase.storage
      .from('generated-pdfs')
      .upload(storagePath, pdfBytes);
    
    // Get public URL
    const { data } = options.supabase.storage
      .from('generated-pdfs')
      .getPublicUrl(storagePath);
    
      // Save metadata (example using form_events)
      await options.supabase
         .from('form_events')
         .insert([{
            form_id: options.formId,
            event_type: 'pdf_generated',
            actor_id: options.actorId,
            payload: { pdf_url: data.publicUrl, filename: options.filename, params },
         }]);
  }
  
  return pdfBytes;
}
```

## Benefits of This Architecture

1. **Separation of Concerns:**
   - Templates separate from data
   - Client info separate from form submissions
   - Generated PDFs tracked independently

2. **Audit Trail:**
   - Complete history of all form submissions
   - Timestamps on everything
   - Can regenerate PDFs from stored data

3. **Flexibility:**
   - Easy to add new form types
   - Forms can have different fields
   - Client info stays consistent

4. **Prefill Intelligence:**
   - Uses latest submission for best prefill
   - Falls back to client info if no submission
   - Handles complex data types (arrays, nested objects)

5. **Scalability:**
   - Efficient queries with proper indexes
   - Storage separate from database
   - Can handle multiple form types per client

## File Structure

```
/migrations/
  - add_client_fields.sql           # Client table schema
  - create_form_templates.sql       # Form templates table + seed data
   - create_forms_tables.sql         # Generic forms + form_events tables
   - create_kyc_collected_info.sql   # (Deprecated) legacy KYC collected info
   - create_kyc_form_pdf.sql         # (Deprecated) legacy PDF metadata

/src/components/
  - ClientForm.jsx                  # Basic client CRUD
  - KYCForm.jsx                     # KYC form with new architecture
  - [OtherForm].jsx                 # Future form types

/src/utils/
  - kycFiller.js                    # KYC-specific PDF filler
  - pdfGenerator.js                 # Generic PDF utilities
  - logger.js                       # Logging utilities

/src/data/
  - kyc_field_mappings.json         # UI field -> PDF field mappings
  - kyc_pdf_fields.json             # PDF field definitions
```

## Migration Path

To apply this architecture to the existing system:

1. Run migration files in order:
   - `create_form_templates.sql`
   - `create_forms_tables.sql`
   - (Optional legacy) `create_kyc_collected_info.sql` + `create_kyc_form_pdf.sql` if you still need old tables

2. Update the form_templates table with your actual PDF URL

3. Create storage buckets:
   - `form-templates` (for PDF templates)
   - `generated-pdfs` (private bucket for generated PDFs)

4. Set storage policies:
   ```sql
   -- Private bucket for generated PDFs
   insert into storage.buckets (id, name, public) values ('generated-pdfs', 'generated-pdfs', false)
   on conflict (id) do nothing;
   
   -- Authenticated users can upload/write
   create policy "pdfs authenticated write"
   on storage.objects for all
   using (bucket_id = 'generated-pdfs' and auth.role() = 'authenticated')
   with check (bucket_id = 'generated-pdfs' and auth.role() = 'authenticated');
   ```

5. Test the updated KYCForm component with an existing client

6. For new form types, follow the "Adding a New Form Type" workflow

## Future Enhancements

- Add versioning to form_templates
- Add richer status/workflow tracking in forms (draft, submitted, approved)
- Add signing/approval workflow
- Add email notification when PDFs are generated
- Add batch PDF generation
- Add form analytics and reporting
