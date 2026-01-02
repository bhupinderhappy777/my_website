import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSupabaseClient, useSession } from '../AuthContext';
import {
  ArrowLeft,
  Plus,
  Sun,
  Moon,
  User,
  MapPin,
  Briefcase,
  DollarSign,
  TrendingUp,
  Building,
  FileText,
  Globe,
  Loader2,
} from 'lucide-react';
import { downloadPDF } from '../utils/pdfGenerator';
import logger from '../utils/logger';
import { fillKYCPDF } from '../utils/kycFiller';

/**
 * KYCForm Component - Comprehensive Know Your Client Data Collection
 * 
 * ============================================================================
 * PURPOSE & SCOPE
 * ============================================================================
 * This component provides a full-featured form for collecting detailed client
 * information required for KYC (Know Your Client) compliance in financial services.
 * It supports both individual and joint accounts, with comprehensive investment
 * profile data, tax residency tracking, and identity verification workflows.
 * 
 * ============================================================================
 * ARCHITECTURE PATTERN: Form-Agnostic Storage
 * ============================================================================
 * The application uses a three-tier data storage strategy:
 * 
 * 1. CLIENTS TABLE (Core Identity)
 *    - Stores fundamental client identity and contact information
 *    - Acts as the "source of truth" for client records
 *    - Updated when client submits or updates KYC forms
 *    - Fields: name, email, address, SIN, DOB, phone, employer, etc.
 * 
 * 2. FORMS TABLE (Submission History)
 *    - Stores complete snapshots of ALL form submissions
 *    - Supports multiple form types: 'kyc', 'trade_ticket', 'investor_profile'
 *    - Each submission is immutable - creates new record on each save
 *    - Contains full JSON payload of form data in 'data' column
 *    - Enables audit trail and historical tracking
 * 
 * 3. FORM_TEMPLATES TABLE (PDF Configuration)
 *    - Stores metadata about available form templates
 *    - Links to PDF templates used for generation
 *    - Contains template IDs and URLs for PDF fill operations
 * 
 * ============================================================================
 * DATA FLOW: PREFILL STRATEGY
 * ============================================================================
 * When the form loads, it follows a two-tier prefill approach:
 * 
 * TIER 1 (Preferred): Latest Form Submission
 *   1. Query forms table WHERE form_type='kyc' AND client_id=<id>
 *   2. Order by created_at DESC, take most recent
 *   3. If found, extract complete data payload from submission
 *   4. Populate ALL form fields from this saved state
 *   5. Restore dynamic arrays (otherCountries, otherInvestments, etc.)
 *   → Ensures users see exactly what they previously submitted
 * 
 * TIER 2 (Fallback): Client Table Baseline
 *   1. If no previous submission exists, query clients table
 *   2. Load basic fields (name, address, phone, email, etc.)
 *   3. Provides starting point for first-time form completion
 *   → Only basic identity fields are available from this source
 * 
 * ============================================================================
 * DATA FLOW: SUBMISSION WORKFLOW
 * ============================================================================
 * When the user submits the form:
 * 
 * 1. NORMALIZE & VALIDATE
 *    - Flatten dynamic arrays (tax_residency, investments, approval_documents)
 *    - Replace "Other" checkboxes with actual custom values
 *    - Validate required fields via react-hook-form
 * 
 * 2. SAVE TO FORMS TABLE
 *    - Insert new record with form_type='kyc'
 *    - Store complete normalized data as JSON in 'data' column
 *    - Link to client_id and form_template_id
 *    - Set status='submitted'
 *    → Creates permanent audit record of submission
 * 
 * 3. UPDATE CLIENTS TABLE
 *    - Extract core client fields from submission
 *    - Update client record with latest information
 *    - Handle errors gracefully (submission already saved)
 *    → Keeps client master record current
 * 
 * 4. GENERATE PDF
 *    - Call fillKYCPDF utility with normalized data
 *    - Map form fields to PDF field names via kyc_field_mappings.json
 *    - Handle radio buttons, checkboxes, text fields
 *    - Trigger browser download of filled PDF
 *    → Provides printable/shareable compliance document
 * 
 * ============================================================================
 * STATE MANAGEMENT
 * ============================================================================
 * React Hook Form:
 *   - Primary form state managed by useForm() hook
 *   - Automatic validation and error handling
 *   - watch() for reactive field dependencies
 *   - register() for field binding
 * 
 * Component State:
 *   - otherCountries: Tax residency countries beyond Canada/USA
 *   - otherInvestments: Investment types beyond standard options
 *   - approvalOtherText: Custom approval documents (semicolon-separated)
 *   - theme: Light/dark mode preference (persisted to localStorage)
 *   - generating: PDF generation in-progress flag
 *   - error: Error message display state
 *   - pdfUrl: Template URL from form_templates table
 *   - formTemplateId: Template UUID for database relationships
 * 
 * Computed State:
 *   - isJointAccount: Reactive computed from joint_account checkbox
 *   - account_type: Auto-synced with isJointAccount for PDF mapping
 * 
 * ============================================================================
 * JOINT ACCOUNT SUPPORT
 * ============================================================================
 * When joint_account checkbox is enabled:
 *   - Displays additional "Joint Applicant" section
 *   - Collects full profile for second account holder
 *   - Stores joint applicant data in nested object: joint_applicant.*
 *   - Automatically sets account_type to 'joint' for PDF radio mapping
 *   - Joint data stays in forms.data JSON, does NOT create separate client
 * 
 * ============================================================================
 * INVESTMENT INFORMATION ARCHITECTURE
 * ============================================================================
 * The form collects comprehensive investment profile data:
 * 
 * - Account/Plan Configuration:
 *   • Account Type: individual vs joint (synced with joint toggle)
 *   • Plan Status: New vs Updated account
 *   • Plan ID: Policy/account number
 *   • Plan Type: RRSP, TFSA, RRIF, Non-Registered, etc.
 * 
 * - Investment Objectives (Portfolio Allocation):
 *   • Safety: Conservative/capital preservation allocation %
 *   • Income: Income-generating investments allocation %
 *   • Growth: Growth-oriented allocation %
 *   • Speculative: High-risk/high-reward allocation %
 *   → Should total 100% if using percentages
 * 
 * - Risk Profile:
 *   • Time Horizon: Investment timeframe (<1yr to 20+yrs)
 *   • Risk Tolerance: Low, Low-Medium, Medium, Medium-High, High
 *   • Investment Purpose: Retirement, Estate, Education, Tax, Other
 * 
 * - Legacy Fields:
 *   • Primary Investment Objective: Single-choice safety/income/growth
 *   • Investment Knowledge: Novice through Expert
 * 
 * ============================================================================
 * DYNAMIC ARRAY FIELDS
 * ============================================================================
 * Several fields support user-defined custom values:
 * 
 * 1. Tax Residency:
 *    - Standard: Canada, USA checkboxes
 *    - Custom: "Other" checkbox reveals input to add countries
 *    - Stored as: array combining standard + custom values
 * 
 * 2. Investment Types:
 *    - Standard: Bonds, Stocks, Mutual Funds, GICs, Real Estate, etc.
 *    - Custom: "Other" checkbox reveals input to add investment types
 *    - Stored as: array combining standard + custom values
 * 
 * 3. Approval Documents:
 *    - Standard: Driver's License, Birth Certificate, Passport
 *    - Custom: "Other" checkbox reveals text input (semicolon-separated)
 *    - Stored as: array combining standard + parsed custom values
 * 
 * ============================================================================
 * PDF GENERATION & MAPPING
 * ============================================================================
 * PDF generation uses a sophisticated field mapping system:
 * 
 * 1. kyc_field_mappings.json:
 *    - Maps logical form field names to PDF field names
 *    - Defines field types: text, checkbox, radio_group, array
 *    - Provides value_map for radio buttons (e.g., income brackets)
 *    - Handles both individual and joint field variants
 * 
 * 2. kycFiller.js:
 *    - Orchestrates PDF filling using pdf-lib wrapper
 *    - Normalizes annual_income to bracketed ranges before mapping
 *    - Toggles radio buttons by setting mapped field to "On"
 *    - Handles checkbox on/off values
 *    - Joins arrays with ", " for multi-value fields
 * 
 * 3. Annual Income Bucketing:
 *    - User enters numeric value (e.g., 75000)
 *    - Filler buckets to range: "$50,000-$74,999"
 *    - Maps to PDF radio button via value_map
 *    - Ensures consistent radio selection in PDF
 * 
 * ============================================================================
 * ACCESSIBILITY & UX
 * ============================================================================
 * - Dark mode support with theme toggle (persisted to localStorage)
 * - Responsive grid layouts for mobile/tablet/desktop
 * - Clear section organization with icons
 * - Inline validation via react-hook-form
 * - Loading states during PDF generation
 * - Error message display for failed operations
 * - Required field indicators (*)
 * - Placeholder text for guidance
 */
export default function KYCForm() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const navigate = useNavigate();
  const { id } = useParams(); // Client UUID from URL params

  console.log('KYCForm rendered with id:', id);

  // ============================================================================
  // FORM STATE MANAGEMENT (react-hook-form)
  // ============================================================================
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  // ============================================================================
  // COMPONENT STATE
  // ============================================================================
  
  // Dynamic arrays for tax residency countries beyond Canada/USA
  // Users can add custom countries via "Other" checkbox + input field
  const [otherCountries, setOtherCountries] = useState([]);
  const [otherInput, setOtherInput] = useState('');
  
  // Dynamic arrays for investment types beyond standard options
  // Users can add custom investment types via "Other" checkbox + input field
  const [otherInvestments, setOtherInvestments] = useState([]);
  const [otherInvestmentInput, setOtherInvestmentInput] = useState('');
  
  // Text input for non-standard approval documents (semicolon-separated list)
  // e.g., "National ID; Local Permit; Military ID"
  const [approvalOtherText, setApprovalOtherText] = useState('');
  
  // UI theme preference: 'light' or 'dark'
  // Persisted to localStorage and applied to document root
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('theme')) || 'light');
  
  // PDF generation state flags
  const [generating, setGenerating] = useState(false); // True while PDF is being generated
  const [error, setError] = useState(null); // Error message to display if generation fails
  
  // Form template data fetched from form_templates table
  const [pdfUrl, setPdfUrl] = useState(null); // URL to PDF template for generation
  const [formTemplateId, setFormTemplateId] = useState(null); // UUID for database relationships
  
  // Reactive computed state: true when user checks "This is a joint account"
  // Triggers display of Joint Applicant section
  const isJointAccount = watch('joint_account');

  // ============================================================================
  // EFFECT: Account Type Synchronization
  // ============================================================================
  // Keep the account_type field in sync with the joint toggle for PDF mapping consistency
  // This ensures that when joint_account checkbox is toggled, the account_type radio
  // automatically updates to match, which is required for proper PDF field mapping
  useEffect(() => {
    setValue('account_type', isJointAccount ? 'joint' : 'individual');
  }, [isJointAccount, setValue]);

  // ============================================================================
  // EFFECT: Theme Management
  // ============================================================================
  // Sync theme preference with localStorage and apply to document root
  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore (localStorage not available)
    }
  }, [theme]);

  // ============================================================================
  // EFFECT: Prefill Form Data
  // ============================================================================
  /**
   * Prefill Strategy (Two-tier approach):
   * 
   * TIER 1 (Preferred): Load from latest form submission
     *   - Query forms (form_type='kyc') for most recent submission for this client
     *   - If found, use complete data payload from that submission
   *   - This ensures users see their previous answers exactly as submitted
   * 
   * TIER 2 (Fallback): Load from clients table
   *   - If no previous submission exists, load basic client info from clients table
   *   - This provides a starting point for first-time form fills
   *   - Only basic fields are available (name, address, phone, etc.)
   * 
   * Why two tiers?
   *   - Form submissions may contain temporary/working data that shouldn't update client record
   *   - Allows forms to have draft-like functionality
   *   - Client table stays as source of truth for core identity data
   *   - Form submissions track the complete history of what was collected
   */
  // Prefill logic: First try to get latest submission from forms (form_type='kyc'), then fall back to clients table
  useEffect(() => {
    if (!id) return;
    console.log('KYCForm: Starting prefill for id:', id);
    let mounted = true;
    (async () => {
      try {
        // First, try to get the latest form submission for this client and form type
        const { data: latestSubmission, error: submissionError } = await supabase
          .from('forms')
          .select('data')
          .eq('client_id', id)
          .eq('form_type', 'kyc')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If we have a previous submission, use that data for prefill
        if (!submissionError && latestSubmission && latestSubmission.data) {
          console.log('KYCForm: Prefilling from latest submission');
          const formData = latestSubmission.data;
          
          if (mounted) {
            // Reset form with submission data
            reset(formData);

            // Handle tax_residency array properly
            if (formData.tax_residency) {
              const arr = Array.isArray(formData.tax_residency) ? formData.tax_residency : [formData.tax_residency];
              const hasCanada = arr.includes('Canada');
              const hasUSA = arr.includes('USA');
              const others = arr.filter(x => x !== 'Canada' && x !== 'USA');
              const checked = [];
              if (hasCanada) checked.push('Canada');
              if (hasUSA) checked.push('USA');
              if (others.length) checked.push('Other');
              setValue('tax_residency', checked);
              setOtherCountries(others);
            }

            // Handle investments array properly
            if (formData.investments) {
              const iarr = Array.isArray(formData.investments) ? formData.investments : [formData.investments];
              const standardInvestments = ['Bonds','Segregated Funds','Stocks','Mutual Funds','Term Deposits/GIC','Real Estate & Mortgages'];
              const std = iarr.filter(i => standardInvestments.includes(i));
              const othersInv = iarr.filter(i => !standardInvestments.includes(i));
              setValue('investments', std.concat(othersInv.length ? ['Other'] : []));
              setOtherInvestments(othersInv);
            }

            // Handle approval_documents array properly
            if (formData.approval_documents) {
              const darr = Array.isArray(formData.approval_documents) ? formData.approval_documents : [formData.approval_documents];
              const standardDocs = ["Driver's License","Birth Certificate","Passport"];
              const stdDocs = darr.filter(d => standardDocs.includes(d));
              const otherDocs = darr.filter(d => !standardDocs.includes(d));
              setValue('approval_documents', stdDocs.concat(otherDocs.length ? ['Other'] : []));
              setApprovalOtherText(otherDocs.join('; '));
            }
          }
          return;
        }

        // No previous submission found, fall back to clients table for basic info
        console.log('KYCForm: No previous submission, prefilling from clients table');
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (clientError) {
          console.error('Error loading client:', clientError);
          return;
        }

        if (mounted && clientData) {
          console.log('KYCForm: Prefilling with client data:', clientData);
          // Reset form with basic data first
          reset(clientData);

          console.log('KYCForm: Prefilling with client data:', clientData);
          // Reset form with basic data first
          reset(clientData);

          // Handle tax_residency: set checkboxes and other countries
          if (clientData.tax_residency) {
            const arr = Array.isArray(clientData.tax_residency) ? clientData.tax_residency : (typeof clientData.tax_residency === 'string' ? [clientData.tax_residency] : []);
            const hasCanada = arr.includes('Canada');
            const hasUSA = arr.includes('USA');
            const others = arr.filter(x => x !== 'Canada' && x !== 'USA');
            const checked = [];
            if (hasCanada) checked.push('Canada');
            if (hasUSA) checked.push('USA');
            if (others.length) checked.push('Other');
            setValue('tax_residency', checked);
            setOtherCountries(others);
          }

          // Handle investments: set checkboxes and other investments
          if (clientData.investments) {
            const iarr = Array.isArray(clientData.investments) ? clientData.investments : (typeof clientData.investments === 'string' ? [clientData.investments] : []);
            const standardInvestments = ['Bonds','Segregated Funds','Stocks','Mutual Funds','Term Deposits/GIC','Real Estate & Mortgages'];
            const std = iarr.filter(i => standardInvestments.includes(i));
            const othersInv = iarr.filter(i => !standardInvestments.includes(i));
            setValue('investments', std.concat(othersInv.length ? ['Other'] : []));
            setOtherInvestments(othersInv);
          }

          // Handle approval_documents: set checkboxes and other text
          if (clientData.approval_documents) {
            const darr = Array.isArray(clientData.approval_documents) ? clientData.approval_documents : (typeof clientData.approval_documents === 'string' ? [clientData.approval_documents] : []);
            const standardDocs = ["Driver's License","Birth Certificate","Passport"];
            const stdDocs = darr.filter(d => standardDocs.includes(d));
            const otherDocs = darr.filter(d => !standardDocs.includes(d));
            setValue('approval_documents', stdDocs.concat(otherDocs.length ? ['Other'] : []));
            setApprovalOtherText(otherDocs.join('; '));
          }

          // Set other fields explicitly if needed
          if (clientData.document_number) setValue('document_number', clientData.document_number);
          if (clientData.document_jurisdiction) setValue('document_jurisdiction', clientData.document_jurisdiction);
          if (clientData.document_expiry) setValue('document_expiry', clientData.document_expiry);
          if (clientData.citizenship) setValue('citizenship', clientData.citizenship);
          if (clientData.citizenship_other) setValue('citizenship_other', clientData.citizenship_other);
          if (clientData.id_verified_physical !== undefined) setValue('id_verified_physical', clientData.id_verified_physical);
        }
      } catch (err) {
        console.error('Error during prefill:', err);
      }
    })();
    return () => { mounted = false; };
  }, [id, reset, setValue, supabase]);

  // ============================================================================
  // EFFECT: Set Default Tax Residency for New Forms
  // ============================================================================
  // For new forms (no client ID), default to Canada as tax residency
  useEffect(() => {
    if (id) return;
    setValue('tax_residency', ['Canada']);
  }, [id, setValue]);

  // ============================================================================
  // EFFECT: Auto-calculate Net Worth
  // ============================================================================
  // Net Worth = Fixed Assets + Liquid Assets - Liabilities
  // Recalculates automatically when any of these fields change
  useEffect(() => {
    const fixed = parseFloat(watch('fixed_assets')) || 0;
    const liquid = parseFloat(watch('liquid_assets')) || 0;
    const liabilities = parseFloat(watch('liabilities')) || 0;
    const computed = fixed + liquid - liabilities;
    if (Number.isFinite(computed)) setValue('net_worth', Math.round(computed));
  }, [watch('fixed_assets'), watch('liquid_assets'), watch('liabilities'), setValue]);

  // ============================================================================
  // EFFECT: Fetch KYC PDF Template
  // ============================================================================
  /**
   * Fetches the KYC form template from form_templates table on component mount.
   * This provides:
   *   1. formTemplateId - UUID for linking submissions and PDFs
   *   2. pdfUrl - URL to the blank PDF template for generation
   * 
   * The template must be uploaded to Supabase Storage and registered in
   * form_templates table before forms can be generated.
   */
  useEffect(() => {
    const fetchKycTemplate = async () => {
      try {
        const { data: templates, error } = await supabase
          .from('form_templates')
          .select('id, pdf_url')
          .ilike('name', '%kyc%')
          .limit(1);

        if (error) {
          logger.error('Failed to fetch KYC template', { error });
          return;
        }

        if (templates && templates.length > 0) {
          setPdfUrl(templates[0].pdf_url);
          setFormTemplateId(templates[0].id);
          logger.info('Fetched KYC PDF URL', { pdfUrl: templates[0].pdf_url, formTemplateId: templates[0].id });
        } else {
          logger.warn('No KYC template found in database');
        }
      } catch (err) {
        logger.error('Error fetching KYC template', { error: err });
      }
    };

    fetchKycTemplate();
  }, [supabase]);

  const onSubmit = async (data) => {
    if (!pdfUrl || !formTemplateId) {
      setError('KYC PDF template not available. Please try again later.');
      return;
    }

    if (!id) {
      setError('Client ID is required. Please select a client first.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      logger.info('KYC form submission started', { clientId: id });

      const isJoint = !!data.joint_account;
      const jointApplicant = isJoint ? (data.joint_applicant || {}) : null;

      // Normalize form data
      const rawResidency = data.tax_residency ?? ['Canada'];
      const residencyArray = Array.isArray(rawResidency)
        ? rawResidency.slice()
        : (typeof rawResidency === 'string' && rawResidency ? [rawResidency] : []);
      const finalTaxResidency = residencyArray.flatMap(item => 
        item === 'Other' ? otherCountries : (item === 'Canada' || item === 'USA' ? item : item)
      );

      const rawInvestments = data.investments || [];
      const investmentsArray = Array.isArray(rawInvestments)
        ? rawInvestments.slice()
        : (typeof rawInvestments === 'string' && rawInvestments ? [rawInvestments] : []);
      const finalInvestments = investmentsArray.flatMap(item => item === 'Other' ? otherInvestments : item);

      const rawApprovalDocs = data.approval_documents || [];
      const approvalDocsArray = Array.isArray(rawApprovalDocs)
        ? rawApprovalDocs.slice()
        : (typeof rawApprovalDocs === 'string' && rawApprovalDocs ? [rawApprovalDocs] : []);
      const finalApprovalDocs = approvalDocsArray.flatMap(item => 
        item === 'Other' ? (approvalOtherText ? approvalOtherText.split(';').map(s => s.trim()).filter(Boolean) : []) : item
      );

      // Prepare complete form data to save in forms table
      const completeFormData = {
        ...data,
        tax_residency: finalTaxResidency,
        investments: finalInvestments,
        approval_documents: finalApprovalDocs,
        // Include the dynamic arrays
        other_countries: otherCountries,
        other_investments: otherInvestments,
        joint_account: isJoint,
        joint_applicant: jointApplicant,
      };

      // Save to generic forms table
      const { data: savedSubmission, error: submissionError } = await supabase
        .from('forms')
        .insert([{ 
          client_id: id,
          form_type: 'kyc',
          form_template_id: formTemplateId,
          status: 'submitted',
          data: completeFormData,
          pdf_url: pdfUrl,
        }])
        .select()
        .single();

      if (submissionError) {
        logger.error('Failed to save form submission', { error: submissionError });
        throw new Error('Failed to save form submission: ' + submissionError.message);
      }

      logger.info('Form submission saved', { submissionId: savedSubmission.id });

      // Update clients table with basic client information that may have changed
      const clientUpdatePayload = {
        email: data.email,
        sin: data.sin,
        first_name: data.first_name,
        last_name: data.last_name,
        dob: data.dob,
        address: data.address,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
        phone_residence: data.phone_residence,
        phone_business: data.phone_business,
        employer: data.employer,
        employer_address: data.employer_address,
        occupation: data.occupation,
        annual_income: data.annual_income,
        net_worth: data.net_worth,
        liquid_assets: data.liquid_assets,
        fixed_assets: data.fixed_assets,
        liabilities: data.liabilities,
        investment_knowledge: data.investment_knowledge,
        risk_tolerance: data.risk_tolerance,
        investment_objective: data.investment_objective,
        title: data.title,
        language_preference: data.language_preference,
        tax_residency: finalTaxResidency,
        investments: finalInvestments,
        bank_name: data.bank_name,
        bank_transit: data.bank_transit,
        bank_institution: data.bank_institution,
        bank_account: data.bank_account,
        bank_address: data.bank_address,
        bank_city: data.bank_city,
        bank_province: data.bank_province,
        bank_postal_code: data.bank_postal_code,
        approval_documents: finalApprovalDocs,
        approval_documents_other: data.approval_documents_other,
        document_number: data.document_number,
        document_jurisdiction: data.document_jurisdiction,
        document_expiry: data.document_expiry,
        citizenship: data.citizenship,
        citizenship_other: data.citizenship_other,
        id_verified_physical: data.id_verified_physical,
      };

      const { error: clientUpdateError } = await supabase
        .from('clients')
        .update(clientUpdatePayload)
        .eq('id', id);

      if (clientUpdateError) {
        logger.warn('Failed to update client info', { error: clientUpdateError });
        // Don't throw here, just log - the submission is already saved
      } else {
        logger.info('Client info updated successfully');
      }

      // Generate filename
      const clientName = data.first_name && data.last_name
        ? `${data.first_name}_${data.last_name}`
        : `Client_${id}`;
      const filename = `KYC_${clientName}.pdf`;

      // Generate PDF using the KYC filler utility
      const { pdfBytes, storagePath } = await fillKYCPDF(
        data,
        otherCountries,
        otherInvestments,
        pdfUrl,
        {
          supabase,
          clientId: id,
          formId: savedSubmission.id,
          actorId: session?.user?.id
        }
      );

      downloadPDF(pdfBytes, filename);

      logger.info('KYC PDF generated successfully', { filename, storagePath });
    } catch (err) {
      logger.error('KYC form submission error', { message: err && err.message, stack: err && err.stack });
      setError('Failed to process form. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const addOtherCountry = () => {
    if (otherInput.trim() && !otherCountries.includes(otherInput.trim())) {
      setOtherCountries(prev => [...prev, otherInput.trim()]);
      setOtherInput('');
    }
  };

  const removeOtherCountry = (country) => {
    setOtherCountries(prev => prev.filter(c => c !== country));
  };

  const addOtherInvestment = () => {
    if (otherInvestmentInput.trim() && !otherInvestments.includes(otherInvestmentInput.trim())) {
      setOtherInvestments(prev => [...prev, otherInvestmentInput.trim()]);
      setOtherInvestmentInput('');
    }
  };

  const removeOtherInvestment = (investment) => {
    setOtherInvestments(prev => prev.filter(i => i !== investment));
  };

  const onApprovalOtherChange = (v) => {
    setApprovalOtherText(v);
    setValue('approval_documents_other', v);
  };

  if (!session) {
    return <Navigate to="/agent-login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ring-1 ring-gray-100 dark:ring-0">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/agent/clients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">KYC Form</h1>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Joint Account Toggle */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Type</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose whether this KYC is for a single or joint account.</p>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('joint_account')} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-800 dark:text-gray-200">This is a joint account</span>
            </label>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <select {...register('title')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                      <option value="">Select Title</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Dr.">Dr.</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                    <input {...register('first_name', { required: true })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                    <input {...register('last_name', { required: true })} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" {...register('email')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Language</label>
                    <select {...register('language_preference')} defaultValue="English" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                      <option value="English">English</option>
                      <option value="French">French</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                    <input type="date" {...register('dob')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIN</label>
                    <input {...register('sin')} placeholder="XXX-XXX-XXX" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Residence Phone</label>
                    <input {...register('phone_residence')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Phone</label>
                    <input {...register('phone_business')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>
                </div>
              </div>

              {isJointAccount && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
                    <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Joint Applicant</h3>
                  </div>
                  <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 mb-4">Collect details for the joint applicant. These stay within the KYC submission data.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                      <input {...register('joint_applicant.first_name')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                      <input {...register('joint_applicant.last_name')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" {...register('joint_applicant.email')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input {...register('joint_applicant.phone')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                      <input type="date" {...register('joint_applicant.dob')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SIN</label>
                      <input {...register('joint_applicant.sin')} placeholder="XXX-XXX-XXX" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                      <input {...register('joint_applicant.address')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                        <input {...register('joint_applicant.city')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
                        <select {...register('joint_applicant.province')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                          <option value="">Select Province</option>
                          <option value="AB">Alberta</option>
                          <option value="BC">British Columbia</option>
                          <option value="MB">Manitoba</option>
                          <option value="NB">New Brunswick</option>
                          <option value="NL">Newfoundland and Labrador</option>
                          <option value="NS">Nova Scotia</option>
                          <option value="NT">Northwest Territories</option>
                          <option value="NU">Nunavut</option>
                          <option value="ON">Ontario</option>
                          <option value="PE">Prince Edward Island</option>
                          <option value="QC">Quebec</option>
                          <option value="SK">Saskatchewan</option>
                          <option value="YT">Yukon</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                      <input {...register('joint_applicant.postal_code')} placeholder="A1A 1A1" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupation</label>
                      <input {...register('joint_applicant.occupation')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employer</label>
                      <input {...register('joint_applicant.employer')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Income</label>
                      <input type="number" {...register('joint_applicant.annual_income')} placeholder="65000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Tolerance</label>
                      <select {...register('joint_applicant.risk_tolerance')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="">Select Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Residency */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tax Residency</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select all countries where you are a tax resident:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" value="Canada" {...register('tax_residency')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Canada</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" value="USA" {...register('tax_residency')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">USA</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" value="Other" {...register('tax_residency')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Other</span>
                      </label>
                    </div>
                  </div>

                  {((watch('tax_residency') || [])).includes('Other') && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Other Countries</label>
                      <div className="flex gap-2 items-center mb-3">
                        <input
                          value={otherInput}
                          onChange={(e) => setOtherInput(e.target.value)}
                          placeholder="Enter country name"
                          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                        />
                        <button
                          type="button"
                          onClick={addOtherCountry}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                        >
                          Add
                        </button>
                      </div>
                      {otherCountries.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {otherCountries.map(country => (
                            <span key={country} className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full px-3 py-1 text-sm">
                              {country}
                              <button
                                type="button"
                                onClick={() => removeOtherCountry(country)}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                    <input {...register('address')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                      <input {...register('city')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
                      <select {...register('province')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="">Select Province</option>
                        <option value="AB">Alberta</option>
                        <option value="BC">British Columbia</option>
                        <option value="MB">Manitoba</option>
                        <option value="NB">New Brunswick</option>
                        <option value="NL">Newfoundland and Labrador</option>
                        <option value="NS">Nova Scotia</option>
                        <option value="NT">Northwest Territories</option>
                        <option value="NU">Nunavut</option>
                        <option value="ON">Ontario</option>
                        <option value="PE">Prince Edward Island</option>
                        <option value="QC">Quebec</option>
                        <option value="SK">Saskatchewan</option>
                        <option value="YT">Yukon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                      <input {...register('postal_code')} placeholder="A1A 1A1" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </div>
                  </div>
                </div>
              </div>

          {/* Employment Information */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employment Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employer</label>
                <input {...register('employer')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employer Address</label>
                <input {...register('employer_address')} placeholder="Full employer address" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occupation</label>
                <input {...register('occupation')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Income</label>
                <input type="number" {...register('annual_income')} placeholder="75000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fixed Assets</label>
                <input type="number" {...register('fixed_assets')} placeholder="100000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Liquid Assets</label>
                <input type="number" {...register('liquid_assets')} placeholder="50000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Liabilities</label>
                <input type="number" {...register('liabilities')} placeholder="20000" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Net Worth</label>
                <input type="number" {...register('net_worth')} readOnly placeholder="Calculated automatically" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Investment Knowledge</label>
                <select {...register('investment_knowledge')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                  <option value="">Select Level</option>
                  <option value="None">None</option>
                  <option value="Limited">Limited</option>
                  <option value="Good">Good</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          {/* Investment Information */}
          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-6 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">Investment Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Account Type</label>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <input type="radio" value="individual" {...register('account_type')} className="text-indigo-600 focus:ring-indigo-500" />
                    Individual
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <input type="radio" value="joint" {...register('account_type')} className="text-indigo-600 focus:ring-indigo-500" />
                    Joint
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Plan Status</label>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <input type="radio" value="New" {...register('plan_status')} className="text-indigo-600 focus:ring-indigo-500" />
                    New
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <input type="radio" value="Updated" {...register('plan_status')} className="text-indigo-600 focus:ring-indigo-500" />
                    Updated
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Plan ID</label>
                <input {...register('plan_id')} placeholder="e.g., Policy number" className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Plan Type</label>
                <select {...register('plan_type')} className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                  <option value="">Select Plan Type</option>
                  <option value="Non-Registered">Non-Registered</option>
                  <option value="RRSP">RRSP</option>
                  <option value="RESP">RESP</option>
                  <option value="RRIF">RRIF</option>
                  <option value="LIRA">LIRA</option>
                  <option value="TFSA">TFSA</option>
                  <option value="SRSP">SRSP</option>
                  <option value="RDSP">RDSP</option>
                  <option value="LIF">LIF</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Investment Objectives (enter % or weight)</p>
                <span className="text-xs text-gray-500 dark:text-gray-400">Should total 100% if using percentages</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">Safety</label>
                  <input type="number" {...register('objective_safety')} placeholder="40" className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">Income</label>
                  <input type="number" {...register('objective_income')} placeholder="20" className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">Growth</label>
                  <input type="number" {...register('objective_growth')} placeholder="30" className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">Speculative</label>
                  <input type="number" {...register('objective_speculative')} placeholder="10" className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Time Horizon</label>
                <select {...register('time_horizon')} className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                  <option value="">Select Time Horizon</option>
                  <option value="<1 year">&lt;1 year</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="4-6 years">4-6 years</option>
                  <option value="7-9 years">7-9 years</option>
                  <option value="10+ years">10+ years</option>
                  <option value="20+ years">20+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Risk Tolerance</label>
                <select {...register('risk_tolerance')} className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                  <option value="">Select Level</option>
                  <option value="Low">Low</option>
                  <option value="Low-Medium">Low-Medium</option>
                  <option value="Medium">Medium</option>
                  <option value="Medium-High">Medium-High</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Investment Purpose</label>
                <select {...register('investment_purpose')} className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                  <option value="">Select Purpose</option>
                  <option value="Retirement Planning">Retirement Planning</option>
                  <option value="Estate Planning">Estate Planning</option>
                  <option value="Child Education">Child Education</option>
                  <option value="Tax Planning">Tax Planning</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Primary Investment Objective</label>
              <select {...register('investment_objective')} className="w-full px-3 py-2 border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                <option value="">Select Objective</option>
                <option value="Safety">Safety</option>
                <option value="Income">Income</option>
                <option value="Growth">Growth</option>
                <option value="Aggressive Growth">Aggressive Growth</option>
              </select>
            </div>
          </div>

          {/* Investment Types */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Investment Types</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select all investment types you're interested in:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Bonds" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Bonds</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Segregated Funds" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Segregated Funds</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Stocks" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Stocks</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Mutual Funds" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mutual Funds</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Term Deposits/GIC" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Term Deposits/GIC</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Real Estate & Mortgages" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Real Estate & Mortgages</span>
                  </label>
                  <label className="flex items-center space-x-2 sm:col-span-2">
                    <input type="checkbox" value="Other" {...register('investments')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Other</span>
                  </label>
                </div>
              </div>

              {((watch('investments') || [])).includes('Other') && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Other Investments</label>
                  <div className="flex gap-2 items-center mb-3">
                    <input
                      value={otherInvestmentInput}
                      onChange={(e) => setOtherInvestmentInput(e.target.value)}
                      placeholder="Enter investment type"
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    />
                    <button
                      type="button"
                      onClick={addOtherInvestment}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                  {otherInvestments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {otherInvestments.map(investment => (
                        <span key={investment} className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full px-3 py-1 text-sm">
                          {investment}
                          <button
                            type="button"
                            onClick={() => removeOtherInvestment(investment)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Banking Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Financial Institution Name</label>
                <input {...register('bank_name')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Banking Numbers</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Transit</label>
                    <input {...register('bank_transit')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Institution</label>
                    <input {...register('bank_institution')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Account</label>
                    <input {...register('bank_account')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Address</label>
                <input {...register('bank_address')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input {...register('bank_city')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Province</label>
                  <select {...register('bank_province')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                    <option value="">Select Province</option>
                    <option value="AB">Alberta</option>
                    <option value="BC">British Columbia</option>
                    <option value="MB">Manitoba</option>
                    <option value="NB">New Brunswick</option>
                    <option value="NL">Newfoundland and Labrador</option>
                    <option value="NS">Nova Scotia</option>
                    <option value="NT">Northwest Territories</option>
                    <option value="NU">Nunavut</option>
                    <option value="ON">Ontario</option>
                    <option value="PE">Prince Edward Island</option>
                    <option value="QC">Quebec</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="YT">Yukon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                  <input {...register('bank_postal_code')} placeholder="A1A 1A1" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
              </div>
            </div>
          </div>

          {/* Client Approval Documentation */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Approval Documentation</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Records verifying identity and citizenship.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Identification Documents</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Driver's License" {...register('approval_documents')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Driver's License</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Birth Certificate" {...register('approval_documents')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Birth Certificate</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Passport" {...register('approval_documents')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Passport</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" value="Other" {...register('approval_documents')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Other</span>
                  </label>
                </div>
              </div>

              {((watch('approval_documents') || [])).includes('Other') && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Other Documents</label>
                  <input
                    value={approvalOtherText}
                    onChange={(e) => onApprovalOtherChange(e.target.value)}
                    placeholder="e.g. National ID; Local Permit"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Number</label>
                  <input {...register('document_number')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jurisdiction</label>
                  <input {...register('document_jurisdiction')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
                  <input type="date" {...register('document_expiry')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Citizenship</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="radio" value="Canadian" {...register('citizenship')} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Canadian</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" value="U.S." {...register('citizenship')} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">U.S.</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" value="Other" {...register('citizenship')} className="border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Other</span>
                  </label>
                </div>
                {watch('citizenship') === 'Other' && (
                  <div className="mt-3">
                    <input {...register('citizenship_other')} placeholder="Specify citizenship" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" {...register('id_verified_physical')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">I have met this client in person and verified their identity physically</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={generating || isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 text-lg font-medium"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                'Generate PDF'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}