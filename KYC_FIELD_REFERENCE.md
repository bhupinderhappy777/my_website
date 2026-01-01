# KYC Form Field Quick Reference

Complete list of all 100+ fields in the WFG Segregated Fund KYC Application Form.

## Section 1: Client & Tax Profile (32 fields)

### Application Type
- `applicant_type` - radio: "individual" | "joint"

### Primary Applicant Identity (9 fields)
- `title` - select: Mr., Mrs., Miss, Ms., Dr.
- `first_name` - text (required)
- `last_name` - text (required)
- `sin` - text: format XXX-XXX-XXX
- `dob` - date (required, must be 18+)
- `email` - email
- `phone_residence` - tel
- `phone_business` - tel

### Primary Applicant Address (5 fields)
- `address` - text (required)
- `city` - text (required)
- `province` - select: AB, BC, MB, NB, NL, NS, ON, PE, QC, SK (required)
- `postal_code` - text: format A1A 1A1
- `language_preference` - select: English, French

### Primary Applicant Employment (3 fields)
- `employer` - text
- `occupation` - text
- `employer_address` - text

### Joint Applicant (7 fields) - *shown only if applicant_type = "joint"*
- `joint_applicant_name` - text
- `joint_applicant_sin` - text: format XXX-XXX-XXX
- `joint_applicant_dob` - date
- `joint_applicant_phone` - tel
- `joint_applicant_address` - text
- `joint_applicant_employer` - text
- `joint_applicant_occupation` - text

### Tax Residence - FATCA/CRS (4 fields)
- `tax_resident_canada` - checkbox
- `tax_resident_us` - checkbox
- `tax_resident_other` - text
- `us_tin` - text (conditional: required if tax_resident_us = true)

---

## Section 2: KYC & Net Worth (22 fields)

### Annual Income (2 fields)
- `annual_income` - select: "Under $25,000", "$25,000 - $49,999", "$50,000 - $74,999", "$75,000 - $99,999", "$100,000 - $124,999", "$125,000 - $199,999", "$200,000 - $999,999", "$1,000,000+"
- `joint_applicant_annual_income` - select: same options

### Investment Knowledge (2 fields)
- `investment_knowledge` - select: "Novice", "Fair", "Good", "Sophisticated"
- `joint_investment_knowledge` - select: same options

### Net Worth Calculator - Primary (4 fields)
- `liquid_assets` - number
- `fixed_assets` - number
- `liabilities` - number
- `net_worth` - number (auto-calculated: liquid + fixed - liabilities)

### Net Worth Calculator - Joint (4 fields)
- `joint_liquid_assets` - number
- `joint_fixed_assets` - number
- `joint_liabilities` - number
- `joint_net_worth` - number (auto-calculated)

### Existing Investment Holdings (6 fields)
- `holdings_bonds` - checkbox
- `holdings_stocks` - checkbox
- `holdings_mutual_funds` - checkbox
- `holdings_etfs` - checkbox
- `holdings_gics` - checkbox
- `holdings_real_estate` - checkbox

---

## Section 3: Investment Objectives & Risk (17 fields)

### Account Setup (4 fields)
- `account_type` - select: "Individual", "Joint"
- `plan_status` - select: "New", "Updated"
- `plan_id` - text
- `plan_type` - select (required): "Non-Registered", "RRSP", "RESP", "RRIF", "LIRA", "TFSA", "SRSP", "RDSP", "LIF"

### Investment Objectives (4 fields) - *must total 100% if any value entered*
- `objective_safety` - number: 0-100
- `objective_income` - number: 0-100
- `objective_growth` - number: 0-100
- `objective_speculative` - number: 0-100

### Risk Tolerance (5 fields) - *must total 100% if any value entered*
- `risk_low` - number: 0-100
- `risk_low_medium` - number: 0-100
- `risk_medium` - number: 0-100
- `risk_medium_high` - number: 0-100
- `risk_high` - number: 0-100

### Time Horizon & Purpose (2 fields)
- `time_horizon` - select: "<1 year", "1-3 years", "4-6 years", "7-9 years", "10+ years", "20+ years"
- `investment_purpose` - select: "Retirement Planning", "Estate Planning", "Child Education", "Wealth Accumulation", "Tax Planning", "Other"

---

## Section 4: Regulatory Disclosures (9 fields)

### PEP Declaration - 5 Categories (5 fields)
- `pep_domestic` - checkbox: Domestic PEP (Canada)
- `pep_foreign` - checkbox: Foreign PEP
- `pep_international_org` - checkbox: Head of International Organization (HIO)
- `pep_family_member` - checkbox: Family Member of PEP
- `pep_close_associate` - checkbox: Close Associate of PEP
- `pep_details` - textarea (required if ANY pep checkbox = true)

### Third Party Declaration (2 fields)
- `third_party_interest` - checkbox: Acting on behalf of third party
- `third_party_details` - textarea (required if third_party_interest = true)

### Privacy (1 field)
- `privacy_consent` - checkbox: Agree to receive marketing

---

## Section 5: Identity Verification (11 fields)

### Identification Document (5 fields)
- `id_type` - select (required): "Driver's License", "Birth Certificate", "Passport", "Other"
- `id_number` - text (required)
- `id_jurisdiction` - text (required): e.g., "British Columbia"
- `id_expiry` - date (required)
- `citizenship` - text: e.g., "Canada"

### Agent Verification Attestations (2 fields) - *both required*
- `agent_met_in_person` - checkbox (must be true)
- `agent_id_verified` - checkbox (must be true)

### Banking Information (4 fields)
- `bank_name` - text: Institution Name
- `bank_transit` - text: 5 digits
- `bank_institution` - text: 3 digits
- `bank_account` - text: Account Number

---

## Section 6: Compliance & Signatures (11 fields)

### Mandatory Acknowledgements (3 fields) - *all required*
- `received_info_folder` - checkbox (must be true)
- `received_leveraging_disclosure` - checkbox (must be true)
- `received_complaint_info` - checkbox (must be true)

### Leveraging Warning (3 fields)
- `understand_leveraging_risk` - checkbox (must be true)
- `understand_tax_deductible` - checkbox
- `borrowing_amount` - number (validates: ≤ 30% of net_worth OR 50% of liquid_assets)

### Electronic Signatures (3 fields)
- `client_signature` - text (required): Type full name
- `signature_date` - date (required)
- `joint_signature` - text (conditional): Type full name if joint application

---

## Field Summary by Type

### Total Fields: **102**

#### By Input Type:
- **text:** 35 fields (names, addresses, IDs, signatures, etc.)
- **checkbox:** 26 fields (PEP, holdings, acknowledgements, etc.)
- **number:** 17 fields (income amounts, percentages, net worth)
- **date:** 7 fields (DOB, expiry dates, signature date)
- **select:** 13 fields (dropdowns for provinces, plan types, etc.)
- **tel:** 4 fields (phone numbers)
- **email:** 1 field
- **textarea:** 2 fields (PEP details, third party details)
- **radio:** 1 field (applicant type)

#### By Requirement Level:
- **Always Required:** 15 fields
- **Conditionally Required:** 8 fields
- **Optional:** 79 fields

#### By Section:
- **Section 1:** 32 fields (Client & Tax Profile)
- **Section 2:** 22 fields (KYC & Net Worth)
- **Section 3:** 17 fields (Investment Objectives)
- **Section 4:** 9 fields (Regulatory Disclosures)
- **Section 5:** 11 fields (Identity Verification)
- **Section 6:** 11 fields (Compliance & Signatures)

---

## Validation Rules Summary

### Format Validations
- **SIN:** Must match regex `^\d{3}-\d{3}-\d{3}$`
- **Postal Code:** Canadian format A1A 1A1
- **Email:** Valid email format
- **US TIN:** XXX-XX-XXXX format

### Business Logic Validations
- **Age:** DOB must indicate ≥ 18 years old
- **Objectives Total:** If any objective value > 0, sum must = 100%
- **Risk Total:** If any risk value > 0, sum must = 100%
- **Leveraging Limit:** borrowing_amount ≤ MAX(net_worth * 0.30, liquid_assets * 0.50)

### Conditional Requirements
- **US TIN:** Required if `tax_resident_us = true`
- **PEP Details:** Required if ANY `pep_*` checkbox = true
- **Third Party Details:** Required if `third_party_interest = true`
- **Joint Fields:** Shown only if `applicant_type = "joint"`
- **Agent Attestations:** Both must be `true` (cannot submit without)
- **Mandatory Acknowledgements:** All 3 must be `true`

---

## Auto-Calculated Fields (2)

1. **net_worth** = liquid_assets + fixed_assets - liabilities
2. **joint_net_worth** = joint_liquid_assets + joint_fixed_assets - joint_liabilities

---

## Conditional Field Display Logic

### Show Joint Applicant Section (7 fields)
**Condition:** `applicant_type === "joint"`
- joint_applicant_name
- joint_applicant_sin
- joint_applicant_dob
- joint_applicant_phone
- joint_applicant_address
- joint_applicant_employer
- joint_applicant_occupation

### Show US TIN Field
**Condition:** `tax_resident_us === true`
- us_tin

### Show PEP Details (required)
**Condition:** ANY of `[pep_domestic, pep_foreign, pep_international_org, pep_family_member, pep_close_associate]` === true
- pep_details (textarea becomes required)

### Show Third Party Details (required)
**Condition:** `third_party_interest === true`
- third_party_details (textarea becomes required)

---

## Data Flow

```
User fills form
    ↓
react-hook-form manages state
    ↓
Auto-calculations run (Net Worth)
    ↓
Validation checks on submit
    ↓
Data mapped via field_mappings
    ↓
PDF generated via pdf-lib
    ↓
Downloaded to user's device
```

---

## Database Column Types (Supabase)

See `/SUPABASE_MAPPINGS.md` for complete SQL schema.

Quick reference:
- TEXT fields: Names, addresses, provinces, etc.
- NUMERIC fields: Income amounts, percentages, net worth
- DATE fields: DOB, expiry dates, signature date
- BOOLEAN fields: Checkboxes (true/false)
- JSONB fields: Holdings can be stored as JSON object

---

## PDF Field Name Examples

These are **example** PDF field names. Check your actual PDF template using the browser console output from `pdfGenerator.js`.

```
first_name → "FirstName_Primary" or "first_name"
sin → "SIN_Primary" or "sin"
net_worth → "NetWorth_Primary" or "net_worth"
plan_type → "PlanType" or "plan_type"
pep_domestic → "PEP_Domestic" (checkbox)
client_signature → "ClientSignature" or "client_signature"
```

To find exact field names:
1. Generate PDF in browser
2. Check browser console
3. Look for "🔍 PDF has X form fields" log
4. Update `field_mappings` in Supabase accordingly

---

## Common Use Cases

### Creating New Client Application
1. Agent logs in
2. Creates new client record (basic info)
3. Navigates to Forms page
4. Selects KYC template
5. Fills all 6 sections (~100 fields)
6. Reviews data
7. Downloads filled PDF
8. Client signs physical or electronic copy
9. Agent uploads to compliance system

### Joint Application
1. Select "Joint" in Section 1
2. Fill primary applicant (Section 1 + 2 + 3)
3. Fill joint applicant (Section 1 + 2)
4. Joint applicant signs in Section 6

### PEP Client
1. Fill all normal fields
2. In Section 4, check applicable PEP category
3. **Must** provide details in textarea
4. Form validates PEP details are not empty
5. Extra compliance review may be needed

### Leveraged Investment
1. Complete Sections 1-5 normally
2. In Section 6, check understanding checkboxes
3. Enter borrowing amount
4. System validates: ≤ 30% Net Worth OR ≤ 50% Liquid Assets
5. If validation fails, user cannot submit

---

This quick reference is a companion to:
- `/SUPABASE_MAPPINGS.md` - Database schema and mappings
- `/KYC_WIZARD_SETUP.md` - Setup and usage guide
- `/src/components/KYCForm.jsx` - Implementation code
