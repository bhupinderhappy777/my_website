# Supabase KYC Form Mappings

This document provides complete mappings for the WFG Segregated Fund Application (KYC/NAAF) form fields to Supabase database schema and PDF generation.

## Database Schema

### Clients Table

The `clients` table should have the following columns to support the full KYC wizard form:

```sql
-- Personal Information (Step 1)
applicant_type TEXT, -- 'individual' or 'joint'
title TEXT,
first_name TEXT NOT NULL,
last_name TEXT NOT NULL,
sin TEXT, -- Format: XXX-XXX-XXX
dob DATE,
address TEXT,
city TEXT,
province TEXT,
postal_code TEXT,
phone_residence TEXT,
phone_business TEXT,
email TEXT,
employer TEXT,
occupation TEXT,
employer_address TEXT,

-- Joint Applicant Information
joint_applicant_name TEXT,
joint_applicant_sin TEXT,
joint_applicant_dob DATE,
joint_applicant_phone TEXT,
joint_applicant_address TEXT,
joint_applicant_employer TEXT,
joint_applicant_occupation TEXT,

-- Tax Residence (FATCA/CRS)
tax_resident_canada BOOLEAN DEFAULT true,
tax_resident_us BOOLEAN DEFAULT false,
tax_resident_other TEXT,
us_tin TEXT,

-- KYC Data (Step 2)
annual_income TEXT,
joint_applicant_annual_income TEXT,
investment_knowledge TEXT,
joint_investment_knowledge TEXT,

-- Net Worth (Auto-calculated)
liquid_assets NUMERIC DEFAULT 0,
fixed_assets NUMERIC DEFAULT 0,
liabilities NUMERIC DEFAULT 0,
net_worth NUMERIC DEFAULT 0,
joint_liquid_assets NUMERIC DEFAULT 0,
joint_fixed_assets NUMERIC DEFAULT 0,
joint_liabilities NUMERIC DEFAULT 0,
joint_net_worth NUMERIC DEFAULT 0,

-- Investment Holdings
holdings_bonds BOOLEAN DEFAULT false,
holdings_stocks BOOLEAN DEFAULT false,
holdings_mutual_funds BOOLEAN DEFAULT false,
holdings_etfs BOOLEAN DEFAULT false,
holdings_gics BOOLEAN DEFAULT false,
holdings_real_estate BOOLEAN DEFAULT false,

-- Investment Instructions (Step 3)
plan_type TEXT, -- RRSP, TFSA, RESP, RRIF, LIRA, etc.
account_type TEXT,
plan_status TEXT,
plan_id TEXT,

-- Investment Objectives (Must total 100%)
objective_safety NUMERIC DEFAULT 0,
objective_income NUMERIC DEFAULT 0,
objective_growth NUMERIC DEFAULT 0,
objective_speculative NUMERIC DEFAULT 0,

-- Risk Tolerance (Must total 100%)
risk_low NUMERIC DEFAULT 0,
risk_low_medium NUMERIC DEFAULT 0,
risk_medium NUMERIC DEFAULT 0,
risk_medium_high NUMERIC DEFAULT 0,
risk_high NUMERIC DEFAULT 0,

time_horizon TEXT,
investment_purpose TEXT,

-- Regulatory Disclosures (Step 4)
pep_domestic BOOLEAN DEFAULT false,
pep_foreign BOOLEAN DEFAULT false,
pep_international_org BOOLEAN DEFAULT false,
pep_family_member BOOLEAN DEFAULT false,
pep_close_associate BOOLEAN DEFAULT false,
pep_details TEXT,

third_party_interest BOOLEAN DEFAULT false,
third_party_details TEXT,

-- Identity Verification (Step 5)
id_type TEXT,
id_number TEXT,
id_jurisdiction TEXT,
id_expiry DATE,
citizenship TEXT,

agent_met_in_person BOOLEAN DEFAULT false,
agent_id_verified BOOLEAN DEFAULT false,

-- Banking Information
bank_name TEXT,
bank_transit TEXT,
bank_institution TEXT,
bank_account TEXT,

-- Compliance & Signatures (Step 6)
received_info_folder BOOLEAN DEFAULT false,
received_leveraging_disclosure BOOLEAN DEFAULT false,
received_complaint_info BOOLEAN DEFAULT false,
understand_leveraging_risk BOOLEAN DEFAULT false,
understand_tax_deductible BOOLEAN DEFAULT false,

borrowing_amount NUMERIC DEFAULT 0,

client_signature TEXT,
signature_date DATE,
joint_signature TEXT,

-- Privacy
privacy_consent BOOLEAN DEFAULT false,
language_preference TEXT DEFAULT 'English',

-- Metadata
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(),
agent_id UUID REFERENCES auth.users(id)
```

## PDF Field Mappings

### WFG Segregated Fund Application PDF Fields

Map the following form fields to PDF field names. Adjust based on your actual PDF template:

#### Personal Information
- `Title` → PDF: "title" or "Title_Primary"
- `First Name` → PDF: "first_name" or "FirstName_Primary"
- `Last Name` → PDF: "last_name" or "LastName_Primary"
- `SIN` → PDF: "sin" or "SIN_Primary"
- `Date of Birth` → PDF: "dob" or "DOB_Primary"
- `Address` → PDF: "address" or "Address_Primary"
- `City` → PDF: "city" or "City_Primary"
- `Province` → PDF: "province" or "Province_Primary"
- `Postal Code` → PDF: "postal_code" or "PostalCode_Primary"
- `Email` → PDF: "email" or "Email_Primary"
- `Phone (Residence)` → PDF: "phone_residence" or "Phone_Res_Primary"
- `Phone (Business)` → PDF: "phone_business" or "Phone_Bus_Primary"
- `Employer` → PDF: "employer" or "Employer_Primary"
- `Occupation` → PDF: "occupation" or "Occupation_Primary"

#### Joint Applicant
- `Joint First Name` → PDF: "joint_applicant_name" or "FirstName_Joint"
- `Joint SIN` → PDF: "joint_applicant_sin" or "SIN_Joint"
- `Joint DOB` → PDF: "joint_applicant_dob" or "DOB_Joint"
- `Joint Phone` → PDF: "joint_applicant_phone" or "Phone_Joint"
- `Joint Address` → PDF: "joint_applicant_address" or "Address_Joint"
- `Joint Employer` → PDF: "joint_applicant_employer" or "Employer_Joint"
- `Joint Occupation` → PDF: "joint_applicant_occupation" or "Occupation_Joint"

#### Tax Residence
- `Tax Resident Canada` → PDF: "tax_resident_canada" (checkbox)
- `Tax Resident US` → PDF: "tax_resident_us" (checkbox)
- `Other Jurisdiction` → PDF: "tax_resident_other"
- `US TIN` → PDF: "us_tin" or "US_TIN"

#### KYC Information
- `Annual Income` → PDF: "annual_income" or "Income_Primary"
- `Joint Annual Income` → PDF: "joint_applicant_annual_income" or "Income_Joint"
- `Investment Knowledge` → PDF: "investment_knowledge" or "InvKnowledge_Primary"
- `Joint Investment Knowledge` → PDF: "joint_investment_knowledge" or "InvKnowledge_Joint"

#### Net Worth
- `Liquid Assets` → PDF: "liquid_assets" or "LiquidAssets_Primary"
- `Fixed Assets` → PDF: "fixed_assets" or "FixedAssets_Primary"
- `Liabilities` → PDF: "liabilities" or "Liabilities_Primary"
- `Net Worth` → PDF: "net_worth" or "NetWorth_Primary" (auto-calculated)
- `Joint Liquid Assets` → PDF: "joint_liquid_assets" or "LiquidAssets_Joint"
- `Joint Fixed Assets` → PDF: "joint_fixed_assets" or "FixedAssets_Joint"
- `Joint Liabilities` → PDF: "joint_liabilities" or "Liabilities_Joint"
- `Joint Net Worth` → PDF: "joint_net_worth" or "NetWorth_Joint" (auto-calculated)

#### Investment Objectives
- `Plan Type` → PDF: "plan_type" or "PlanType"
- `Account Type` → PDF: "account_type" or "AccountType"
- `Objective Safety %` → PDF: "objective_safety" or "Obj_Safety"
- `Objective Income %` → PDF: "objective_income" or "Obj_Income"
- `Objective Growth %` → PDF: "objective_growth" or "Obj_Growth"
- `Objective Speculative %` → PDF: "objective_speculative" or "Obj_Speculative"

#### Risk Tolerance
- `Risk Low %` → PDF: "risk_low" or "Risk_Low"
- `Risk Low/Medium %` → PDF: "risk_low_medium" or "Risk_LowMed"
- `Risk Medium %` → PDF: "risk_medium" or "Risk_Medium"
- `Risk Medium/High %` → PDF: "risk_medium_high" or "Risk_MedHigh"
- `Risk High %` → PDF: "risk_high" or "Risk_High"
- `Time Horizon` → PDF: "time_horizon" or "TimeHorizon"
- `Investment Purpose` → PDF: "investment_purpose" or "InvPurpose"

#### PEP/Third Party
- `PEP Domestic` → PDF: "pep_domestic" (checkbox)
- `PEP Foreign` → PDF: "pep_foreign" (checkbox)
- `PEP Intl Org` → PDF: "pep_international_org" (checkbox)
- `PEP Family` → PDF: "pep_family_member" (checkbox)
- `PEP Associate` → PDF: "pep_close_associate" (checkbox)
- `PEP Details` → PDF: "pep_details" or "PEP_Details"
- `Third Party Interest` → PDF: "third_party_interest" (checkbox)
- `Third Party Details` → PDF: "third_party_details" or "ThirdParty_Details"

#### Identity Verification
- `ID Type` → PDF: "id_type" or "IDType"
- `ID Number` → PDF: "id_number" or "IDNumber"
- `Jurisdiction` → PDF: "id_jurisdiction" or "IDJurisdiction"
- `ID Expiry` → PDF: "id_expiry" or "IDExpiry"
- `Citizenship` → PDF: "citizenship" or "Citizenship"
- `Agent Met in Person` → PDF: "agent_met_in_person" (checkbox)
- `Agent ID Verified` → PDF: "agent_id_verified" (checkbox)

#### Banking
- `Bank Name` → PDF: "bank_name" or "BankName"
- `Transit Number` → PDF: "bank_transit" or "Transit"
- `Institution Number` → PDF: "bank_institution" or "Institution"
- `Account Number` → PDF: "bank_account" or "AccountNumber"

#### Compliance & Signatures
- `Received Info Folder` → PDF: "received_info_folder" (checkbox)
- `Received Leveraging Disclosure` → PDF: "received_leveraging_disclosure" (checkbox)
- `Received Complaint Info` → PDF: "received_complaint_info" (checkbox)
- `Understand Leveraging Risk` → PDF: "understand_leveraging_risk" (checkbox)
- `Borrowing Amount` → PDF: "borrowing_amount" or "BorrowingAmount"
- `Client Signature` → PDF: "client_signature" or "ClientSignature"
- `Signature Date` → PDF: "signature_date" or "SignatureDate"
- `Joint Signature` → PDF: "joint_signature" or "JointSignature"

## Form Templates Table

Store PDF templates and their field mappings:

```sql
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  field_mappings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example field mapping for WFG NAAF form
INSERT INTO form_templates (name, company, pdf_url, field_mappings) VALUES (
  'WFG Segregated Fund Application (KYC)',
  'World Financial Group',
  'https://your-storage-url/wfg-seg-fund-app.pdf',
  '{
    "first_name": "first_name",
    "last_name": "last_name",
    "sin": "sin",
    "dob": "dob",
    "address": "address",
    "city": "city",
    "province": "province",
    "postal_code": "postal_code",
    "email": "email",
    "phone_residence": "phone_residence",
    "phone_business": "phone_business",
    "employer": "employer",
    "occupation": "occupation",
    "net_worth": "net_worth",
    "plan_type": "plan_type",
    "objective_safety": "objective_safety",
    "objective_income": "objective_income",
    "objective_growth": "objective_growth",
    "objective_speculative": "objective_speculative",
    "risk_low": "risk_low",
    "risk_medium": "risk_medium",
    "risk_high": "risk_high"
  }'
);
```

## Validation Rules

### Required Fields by Step

**Step 1 - Client & Tax Profile:**
- first_name (required)
- last_name (required)
- dob (required, must be 18+ years old)
- address (required)
- city (required)
- province (required)
- sin (optional but must match XXX-XXX-XXX format if provided)

**Step 2 - KYC & Net Worth:**
- No strictly required fields, but recommended to complete

**Step 3 - Investment Objectives:**
- plan_type (required)
- Investment Objectives must total 100% (if any value entered)
- Risk Tolerance must total 100% (if any value entered)

**Step 4 - Regulatory Disclosures:**
- If any PEP checkbox is true, pep_details is required
- If third_party_interest is true, third_party_details is required

**Step 5 - Identity Verification:**
- id_type (required)
- id_number (required)
- id_jurisdiction (required)
- id_expiry (required)
- agent_met_in_person (must be true)
- agent_id_verified (must be true)

**Step 6 - Compliance & Signatures:**
- received_info_folder (must be true)
- received_leveraging_disclosure (must be true)
- received_complaint_info (must be true)
- understand_leveraging_risk (must be true)
- client_signature (required)
- signature_date (required)
- If borrowing_amount > 0, must not exceed 30% of Net Worth OR 50% of Net Liquid Assets

### Calculated Fields

1. **Net Worth (Primary):**
   ```
   net_worth = liquid_assets + fixed_assets - liabilities
   ```

2. **Net Worth (Joint):**
   ```
   joint_net_worth = joint_liquid_assets + joint_fixed_assets - joint_liabilities
   ```

3. **Leveraging Validation:**
   ```
   max_borrowing = MAX(net_worth * 0.30, liquid_assets * 0.50)
   borrowing_amount <= max_borrowing
   ```

## Usage in Application

### Creating a Client
```javascript
const { data, error } = await supabase
  .from('clients')
  .insert({
    first_name: 'John',
    last_name: 'Doe',
    dob: '1980-01-01',
    address: '123 Main St',
    city: 'Vancouver',
    province: 'BC',
    agent_id: session.user.id
  })
  .select();
```

### Updating KYC Information
```javascript
const { data, error } = await supabase
  .from('clients')
  .update({
    liquid_assets: 100000,
    fixed_assets: 500000,
    liabilities: 200000,
    net_worth: 400000, // Auto-calculated in UI
    plan_type: 'RRSP',
    objective_growth: 60,
    objective_income: 30,
    objective_safety: 10
  })
  .eq('id', clientId);
```

### Retrieving for PDF Generation
```javascript
const { data: client, error } = await supabase
  .from('clients')
  .select('*')
  .eq('id', clientId)
  .single();

// Map to PDF fields using template's field_mappings
const pdfData = {};
Object.entries(template.field_mappings).forEach(([pdfField, dbField]) => {
  pdfData[pdfField] = client[dbField] || '';
});

// Generate PDF
const pdfBytes = await fillPDF(template.pdf_url, pdfData);
```

## Security Considerations

1. **Row Level Security (RLS):**
   ```sql
   -- Agents can only see their own clients
   CREATE POLICY "Agents see own clients"
     ON clients FOR SELECT
     USING (auth.uid() = agent_id);
   
   CREATE POLICY "Agents update own clients"
     ON clients FOR UPDATE
     USING (auth.uid() = agent_id);
   ```

2. **Sensitive Data:**
   - SIN numbers should be encrypted at rest
   - Banking information should have restricted access
   - Consider using Supabase Vault for highly sensitive data

3. **Audit Trail:**
   ```sql
   CREATE TABLE client_audit_log (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     client_id UUID REFERENCES clients(id),
     agent_id UUID REFERENCES auth.users(id),
     action TEXT,
     changes JSONB,
     timestamp TIMESTAMP DEFAULT NOW()
   );
   ```

## Testing

Sample test data:

```javascript
{
  first_name: "Jane",
  last_name: "Smith",
  sin: "123-456-789",
  dob: "1985-05-15",
  address: "456 Oak Avenue",
  city: "Toronto",
  province: "ON",
  postal_code: "M1M 1M1",
  email: "jane.smith@example.com",
  phone_residence: "416-555-0123",
  liquid_assets: 150000,
  fixed_assets: 450000,
  liabilities: 100000,
  net_worth: 500000,
  plan_type: "RRSP",
  objective_safety: 20,
  objective_income: 30,
  objective_growth: 40,
  objective_speculative: 10,
  risk_low: 10,
  risk_medium: 60,
  risk_high: 30
}
```

## Conclusion

This mapping document provides a comprehensive guide for integrating the WFG Segregated Fund Application form with Supabase and PDF generation. Adjust field names based on your actual PDF template field names, which can be discovered using the PDF form field inspection in the pdfGenerator utility.
