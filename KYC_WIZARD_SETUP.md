# KYC Wizard Form - Setup & Usage Guide

## Overview

The enhanced KYC (Know Your Client) form is a comprehensive 6-step application form for WFG Segregated Fund Account applications (NAAF). It includes all regulatory requirements for FATCA/CRS compliance, PEP declarations, and Canadian financial services regulations.

## Features Implemented

### ✅ Complete 6-Step Workflow

1. **Client & Tax Profile** - Personal information, joint applicant, FATCA/CRS tax residence
2. **KYC & Net Worth** - Income levels, investment knowledge, net worth calculator
3. **Investment Objectives & Risk** - Plan types, objectives percentages, risk tolerance
4. **Regulatory Disclosures** - Detailed PEP checklist (5 categories), third-party declarations
5. **Identity Verification** - ID details, agent attestations, banking information
6. **Compliance & Signatures** - Mandatory acknowledgements, leveraging warnings, electronic signatures

### ✅ Regulatory Compliance Features

- **PEP Declaration** with 5 detailed categories:
  - Domestic PEP (Canada)
  - Foreign PEP
  - Head of International Organization (HIO)
  - Family Member of PEP
  - Close Associate of PEP
  
- **FATCA/CRS Tax Compliance:**
  - Tax resident of Canada checkbox
  - Tax resident of US checkbox with conditional US TIN field
  - Other jurisdiction text field

- **Agent Verification Attestations:**
  - "Met client in person" checkbox (required)
  - "Physically verified ID" checkbox (required)

- **Leveraging Compliance:**
  - Understanding of risk checkbox
  - Tax deductibility checkbox
  - Borrowing amount field with validation warning
  - Automatic validation: Borrowing ≤ 30% of Net Worth OR 50% of Liquid Assets

- **Mandatory Acknowledgements:**
  - Receipt of Information Folder
  - Receipt of Leveraging Disclosure
  - Receipt of Client Complaint Information

### ✅ Auto-Calculations

- **Net Worth (Primary):** `Liquid Assets + Fixed Assets - Liabilities`
- **Net Worth (Joint):** `Joint Liquid + Joint Fixed - Joint Liabilities`
- **Investment Objectives:** Visual warning if total ≠ 100%
- **Risk Tolerance:** Visual warning if total ≠ 100%

### ✅ Data Validation

- **SIN Format:** XXX-XXX-XXX (Canadian format)
- **Age Validation:** Date of Birth must indicate 18+ years
- **Email Validation:** Proper email format
- **Percentage Totals:** Investment Objectives and Risk Tolerance must total 100%
- **Conditional Required Fields:**
  - PEP details required if any PEP category selected
  - Third-party details required if third-party interest checked
  - US TIN required if US tax resident selected

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Database Setup

Run the SQL schema from `/SUPABASE_MAPPINGS.md` in your Supabase SQL Editor to create the `clients` and `form_templates` tables with all required columns.

Key tables:
- `clients` - Stores all KYC form data (100+ columns)
- `form_templates` - Stores PDF templates and field mappings
- Optional: `client_audit_log` - For compliance audit trail

### 3. Row Level Security (RLS)

Enable RLS policies so agents can only access their own clients:

```sql
-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Agents see only their clients
CREATE POLICY "Agents see own clients"
  ON clients FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Agents update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = agent_id);
```

### 4. PDF Template Upload

Upload your WFG Segregated Fund Application PDF to Supabase Storage or a CDN, then add the template to `form_templates`:

```sql
INSERT INTO form_templates (name, company, pdf_url, field_mappings) VALUES (
  'WFG Segregated Fund Application (KYC)',
  'World Financial Group',
  'https://your-storage-url/wfg-naaf-form.pdf',
  '{ "first_name": "first_name", "last_name": "last_name", ... }'
);
```

See `/SUPABASE_MAPPINGS.md` for complete field mapping examples.

### 5. Install Dependencies

```bash
npm install
```

Dependencies already included:
- `react-hook-form` - Form state management
- `@supabase/supabase-js` - Database and auth
- `pdf-lib` - PDF generation
- `lucide-react` - Icons
- `react-router-dom` - Routing

### 6. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:5173`

## Usage

### For Agents

1. **Login:** Navigate to `/agent/login` and sign in with Supabase auth
2. **View Clients:** After login, you'll see `/agent/clients` with your client list
3. **Create Client:** Click "Add New Client" to create a basic client record
4. **Generate KYC Form:** Click on a client to access `/agent/forms/:clientId`
5. **Select Template:** Choose "WFG Segregated Fund Application (KYC)" template
6. **Fill Form:** Complete all 6 sections (60+ fields)
7. **Download PDF:** Click "Download PDF" to generate filled application

### Form Sections Detail

#### Section 1: Client & Tax Profile
- Choose Individual or Joint application type
- Enter primary applicant details (name, SIN, DOB, address, contact, employment)
- If Joint: Enter joint applicant details
- Declare tax residence (Canada, US, Other) with FATCA/CRS compliance

#### Section 2: KYC & Net Worth
- Select annual income range (both primary and joint)
- Select investment knowledge level (Novice to Sophisticated)
- **Net Worth Calculator:** Enter Liquid Assets, Fixed Assets, and Liabilities
  - Net Worth auto-calculates
- Check existing investment holdings (Bonds, Stocks, Mutual Funds, ETFs, GICs, Real Estate)

#### Section 3: Investment Objectives & Risk
- Select Plan Type: RRSP, TFSA, RESP, RRIF, LIRA, SRSP, RDSP, LIF, Non-Registered
- Enter Account Type, Plan Status, Plan ID
- **Investment Objectives** (must total 100%):
  - Safety %
  - Income %
  - Growth %
  - Speculative %
- **Risk Tolerance** (must total 100%):
  - Low %
  - Low/Medium %
  - Medium %
  - Medium/High %
  - High %
- Select Time Horizon and Investment Purpose

#### Section 4: Regulatory Disclosures
- **PEP Declaration:** Check all applicable categories
  - If any selected, provide details in text area (required)
- **Third Party:** Check if acting on behalf of third party
  - If yes, provide details (required)
- Privacy consent for marketing communications

#### Section 5: Identity Verification
- Select ID Type (Driver's License, Passport, Birth Certificate, Other)
- Enter Document Number, Jurisdiction, Expiry Date
- Enter Citizenship
- **Agent Verification:**
  - ✅ Confirm met client in person (required)
  - ✅ Confirm physically verified ID (required)
- Banking Information: Institution Name, Transit, Institution Number, Account Number

#### Section 6: Compliance & Signatures
- **Mandatory Acknowledgements (all required):**
  - ✅ Receipt of Information Folder
  - ✅ Receipt of Leveraging Disclosure
  - ✅ Receipt of Client Complaint Information
- **Leveraging Warning:**
  - ✅ Understand borrowing risk (required)
  - ✅ Understand tax deductibility
  - Enter Borrowing Amount (if applicable)
    - Validates: Amount ≤ 30% of Net Worth OR 50% of Liquid Assets
- **Electronic Signatures:**
  - Client signature (type full name)
  - Signature date
  - Joint signature (if applicable)

## Validation & Business Rules

### Automatic Validations

1. **SIN Format:** Must match `XXX-XXX-XXX` pattern
2. **Age Requirement:** DOB must indicate 18+ years old
3. **Email:** Must be valid email format
4. **Investment Objectives:** If any value entered, total must = 100%
5. **Risk Tolerance:** If any value entered, total must = 100%

### Conditional Required Fields

1. **PEP Details:** Required if any PEP checkbox is selected
2. **Third-Party Details:** Required if "Acting on behalf of third party" is checked
3. **US TIN:** Required if "Tax Resident of US" is checked
4. **Joint Applicant Fields:** Shown only when "Joint" application type selected

### Leveraging Validation

When Borrowing Amount > 0:
```
Max Allowed = MAX(
  Net Worth * 0.30,
  Liquid Assets * 0.50
)

If Borrowing Amount > Max Allowed:
  → Show error, prevent submission
```

## PDF Generation

The form integrates with `/src/utils/pdfGenerator.js` to fill PDF templates:

1. Form data is collected via react-hook-form
2. Field names map to PDF field names using template's `field_mappings`
3. PDF-lib loads the template PDF
4. Form fields are filled programmatically
5. PDF is flattened (if not encrypted) and downloaded

### Troubleshooting PDF Generation

**Issue:** PDF fields not filling
- **Solution:** Check PDF field names using browser console log output
- **Solution:** Update `field_mappings` in `form_templates` table to match exact PDF field names

**Issue:** PDF is encrypted
- **Solution:** Use unlocked PDF template or skip flattening step

## Data Persistence

### Current Implementation
- Form data auto-saved to browser localStorage every 1 second
- Data persists if browser is closed and reopened
- Cleared after successful PDF submission

### Future Enhancement: Database Persistence
```javascript
// Save to Supabase after each major section
const saveProgress = async (formData) => {
  await supabase
    .from('clients')
    .update(formData)
    .eq('id', clientId);
};
```

## Accessibility

- All form fields have proper labels
- Color-coded sections for clarity:
  - Blue: Information/acknowledgements
  - Purple: PEP declarations
  - Yellow: Agent verifications
  - Red: Critical warnings (leveraging)
- Dark mode support throughout
- Responsive design for mobile/tablet/desktop
- Keyboard navigation supported

## Security Best Practices

1. **Row Level Security (RLS):** Agents can only access their own clients
2. **Sensitive Data:** Consider encrypting SIN and banking info using Supabase Vault
3. **Audit Trail:** Log all form submissions and updates to `client_audit_log`
4. **Agent Authentication:** Required before accessing any client data
5. **HTTPS Only:** Ensure production deployment uses HTTPS

## Compliance Notes

This form implements requirements for:
- **FATCA** (Foreign Account Tax Compliance Act) - US tax resident declaration
- **CRS** (Common Reporting Standard) - Multi-jurisdiction tax residence
- **FINTRAC** (Financial Transactions and Reports Analysis Centre of Canada) - PEP identification
- **Canadian Securities Regulations** - KYC, suitability, and leveraging disclosure
- **WFG Compliance** - Segregated fund application requirements

## Files Reference

- `/SUPABASE_MAPPINGS.md` - Complete database schema and field mappings (470 lines)
- `/src/components/KYCForm.jsx` - Enhanced 6-section form (1,200+ lines)
- `/src/components/FormGenerator.jsx` - Form wrapper with PDF generation
- `/src/utils/pdfGenerator.js` - PDF filling utility
- `/src/supabaseClient.js` - Supabase connection

## Support

For technical issues or questions about implementation:
1. Check `/SUPABASE_MAPPINGS.md` for database schema
2. Review form validation in `KYCForm.jsx`
3. Check browser console for debugging info
4. Verify Supabase environment variables
5. Ensure RLS policies are correctly configured

## Next Steps (Optional Enhancements)

- [ ] Add wizard navigation wrapper with progress bar
- [ ] Add Zod validation schemas for TypeScript type safety
- [ ] Create summary/review page before submission
- [ ] Add e-signature capture canvas
- [ ] Implement database auto-save (not just localStorage)
- [ ] Add email notification on form completion
- [ ] Generate compliance audit report PDF
- [ ] Add multi-language support (English/French)
