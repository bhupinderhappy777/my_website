import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSupabaseClient, useSession } from '../AuthContext';
import {
  ArrowLeft,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';

export default function ClientForm() {
  const supabase = useSupabaseClient();
  const session = useSession();
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const [otherCountries, setOtherCountries] = useState([]);
  const [otherInput, setOtherInput] = useState('');
  const [otherInvestments, setOtherInvestments] = useState([]);
  const [otherInvestmentInput, setOtherInvestmentInput] = useState('');
  const [approvalOtherText, setApprovalOtherText] = useState('');
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('theme')) || 'light');
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Personal & Tax', description: 'Basic info and residency' },
    { title: 'Address & Employment', description: 'Location and work details' },
    { title: 'Financial & Investments', description: 'Assets and investment preferences' },
    { title: 'Banking & Approval', description: 'Optional banking and documentation' },
  ];

  useEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore (localStorage not available)
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
      if (error) {
        console.error('Error loading client:', error);
        return;
      }
      if (mounted && data) {
        // Reset form with basic data first
        reset(data);

        // Handle tax_residency: set checkboxes and other countries
        if (data.tax_residency) {
          const arr = Array.isArray(data.tax_residency) ? data.tax_residency : (typeof data.tax_residency === 'string' ? [data.tax_residency] : []);
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
        if (data.investments) {
          const iarr = Array.isArray(data.investments) ? data.investments : (typeof data.investments === 'string' ? [data.investments] : []);
          const standardInvestments = ['Bonds','Segregated Funds','Stocks','Mutual Funds','Term Deposits/GIC','Real Estate & Mortgages'];
          const std = iarr.filter(i => standardInvestments.includes(i));
          const othersInv = iarr.filter(i => !standardInvestments.includes(i));
          setValue('investments', std.concat(othersInv.length ? ['Other'] : []));
          setOtherInvestments(othersInv);
        }

        // Handle approval_documents: set checkboxes and other text
        if (data.approval_documents) {
          const darr = Array.isArray(data.approval_documents) ? data.approval_documents : (typeof data.approval_documents === 'string' ? [data.approval_documents] : []);
          const standardDocs = ["Driver's License","Birth Certificate","Passport"];
          const stdDocs = darr.filter(d => standardDocs.includes(d));
          const otherDocs = darr.filter(d => !standardDocs.includes(d));
          setValue('approval_documents', stdDocs.concat(otherDocs.length ? ['Other'] : []));
          setApprovalOtherText(otherDocs.join('; '));
        }

        // Set other fields explicitly if needed
        if (data.document_number) setValue('document_number', data.document_number);
        if (data.document_jurisdiction) setValue('document_jurisdiction', data.document_jurisdiction);
        if (data.document_expiry) setValue('document_expiry', data.document_expiry);
        if (data.citizenship) setValue('citizenship', data.citizenship);
        if (data.citizenship_other) setValue('citizenship_other', data.citizenship_other);
        if (data.id_verified_physical !== undefined) setValue('id_verified_physical', data.id_verified_physical);
      }
    })();
    return () => { mounted = false; };
  }, [id, reset, setValue, supabase]);

  // default tax residency for new forms
  useEffect(() => {
    if (id) return;
    setValue('tax_residency', ['Canada']);
  }, [id, setValue]);

  // Auto-calc net worth
  useEffect(() => {
    const fixed = parseFloat(watch('fixed_assets')) || 0;
    const liquid = parseFloat(watch('liquid_assets')) || 0;
    const liabilities = parseFloat(watch('liabilities')) || 0;
    const computed = fixed + liquid - liabilities;
    if (Number.isFinite(computed)) setValue('net_worth', Math.round(computed));
  }, [watch('fixed_assets'), watch('liquid_assets'), watch('liabilities'), setValue]);

  if (!session) return <Navigate to="/agent/login" replace />;

  const onSubmit = async (formData) => {
    console.log('Submitting form data:', formData);
    try {
      // normalize tax_residency into an array of strings for Supabase
      const rawResidency = formData.tax_residency ?? ['Canada'];
      const residencyArray = Array.isArray(rawResidency)
        ? rawResidency.slice()
        : (typeof rawResidency === 'string' && rawResidency ? [rawResidency] : []);
      // Replace any 'Other' token with actual otherCountries entries
      const finalTaxResidency = residencyArray.flatMap(item => item === 'Other' ? otherCountries : item === 'Canada' || item === 'USA' ? item : item);

      // investments normalization: form has checkboxes `investments` and extra otherInvestments
      const rawInvestments = formData.investments || [];
      const investmentsArray = Array.isArray(rawInvestments)
        ? rawInvestments.slice()
        : (typeof rawInvestments === 'string' && rawInvestments ? [rawInvestments] : []);
      const finalInvestments = investmentsArray.flatMap(item => item === 'Other' ? otherInvestments : item);

      const payload = {
        ...formData,
        tax_residency: finalTaxResidency,
        investments: finalInvestments,
        // approval_documents normalization: expand 'Other' into provided text (split if multiple)
        approval_documents: (Array.isArray(formData.approval_documents) ? formData.approval_documents.slice() : (typeof formData.approval_documents === 'string' && formData.approval_documents ? [formData.approval_documents] : [])).flatMap(item => item === 'Other' ? (approvalOtherText ? approvalOtherText.split(';').map(s => s.trim()).filter(Boolean) : []) : item),
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        net_worth: formData.net_worth ? parseFloat(formData.net_worth) : null,
        liquid_assets: formData.liquid_assets ? parseFloat(formData.liquid_assets) : null,
        fixed_assets: formData.fixed_assets ? parseFloat(formData.fixed_assets) : null,
        liabilities: formData.liabilities ? parseFloat(formData.liabilities) : null,
      };
      console.log('Payload to save:', payload);

      if (id) {
        const { error } = await supabase.from('clients').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert([payload]);
        if (error) throw error;
      }
      navigate('/agent/clients');
    } catch (e) {
      console.error('Error saving client:', e);
      alert('Failed to save client. Check console for details. Error: ' + e.message);
    }
  };

  const addOtherCountry = () => {
    const v = otherInput.trim();
    if (!v) return;
    // avoid duplicates
    setOtherCountries(prev => {
      if (prev.includes(v)) return prev;
      const next = [...prev, v];
      // ensure 'Other' is selected in the multi-select
      // set single-select to 'Other' so the other input area shows
      setValue('tax_residency', 'Other');
      return next;
    });
    setOtherInput('');
  };

  const removeOtherCountry = (country) => {
    setOtherCountries(prev => prev.filter(c => c !== country));
  };

  const addOtherInvestment = () => {
    const v = otherInvestmentInput.trim();
    if (!v) return;
    setOtherInvestments(prev => {
      if (prev.includes(v)) return prev;
      const next = [...prev, v];
      // ensure the investments checkbox group shows Other
      setValue('investments', 'Other');
      return next;
    });
    setOtherInvestmentInput('');
  };

  const removeOtherInvestment = (item) => {
    setOtherInvestments(prev => prev.filter(p => p !== item));
  };

  const onApprovalOtherChange = (v) => {
    setApprovalOtherText(v);
    setValue('approval_documents_other', v);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ring-1 ring-gray-100 dark:ring-0">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/agent/clients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{id ? 'Edit Client' : 'Add Client'}</h1>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-2 ${
                      index < currentStep ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{steps[currentStep].title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{steps[currentStep].description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 0: Personal & Contact, Tax Residency */}
            {currentStep === 0 && (
              <>
                {/* Personal / Contact */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Personal & Contact</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</span>
                      <select {...register('title')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="">Select Title</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</span>
                      <input {...register('first_name', { required: true })} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</span>
                      <input {...register('last_name', { required: true })} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                      <input type="email" {...register('email')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Language</span>
                      <select {...register('language_preference')} defaultValue="English" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="English">English</option>
                        <option value="French">French</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</span>
                      <input type="date" {...register('dob')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SIN</span>
                      <input {...register('sin')} placeholder="XXX-XXX-XXX" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Residence Phone</span>
                      <input {...register('phone_residence')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Phone</span>
                      <input {...register('phone_business')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>
                  </div>
                </div>

                {/* Tax Residency */}
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tax Residency</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Canada" {...register('tax_residency')} className="rounded" />
                      <span className="text-sm">Canada</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="USA" {...register('tax_residency')} className="rounded" />
                      <span className="text-sm">USA</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Other" {...register('tax_residency')} className="rounded" />
                      <span className="text-sm">Other</span>
                    </label>
                  </div>

                  {((watch('tax_residency') || [])).includes('Other') && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Countries</span>
                      <div className="flex gap-2 mt-2 items-center">
                        <input value={otherInput} onChange={(e) => setOtherInput(e.target.value)} placeholder="Type country and press Add" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                        <button type="button" onClick={addOtherCountry} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {otherCountries.map(c => (
                          <span key={c} className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full px-3 py-1 text-sm">
                            {c}
                            <button type="button" onClick={() => removeOtherCountry(c)} className="text-xs text-gray-500 hover:text-gray-700">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 1: Address, Employment */}
            {currentStep === 1 && (
              <>
                {/* Address */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block md:col-span-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</span>
                      <input {...register('address')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">City</span>
                      <input {...register('city')} className="w-full mt-1 px-3 py-2" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Province</span>
                      <select {...register('province')} className="w-full mt-1 px-3 py-2">
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
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</span>
                      <input {...register('postal_code')} placeholder="A1A 1A1" className="w-full mt-1 px-3 py-2" />
                    </label>
                  </div>
                </div>

                {/* Employment */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Employment</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employer</span>
                      <input {...register('employer')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employer Address</span>
                      <input {...register('employer_address')} placeholder="Employer full address" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Occupation</span>
                      <input {...register('occupation')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Financial, Investments */}
            {currentStep === 2 && (
              <>
                {/* Financial */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Financial Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Income</span>
                      <input type="number" {...register('annual_income')} placeholder="75000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fixed Assets</span>
                      <input type="number" {...register('fixed_assets')} placeholder="100000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Liquid Assets</span>
                      <input type="number" {...register('liquid_assets')} placeholder="50000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Liabilities</span>
                      <input type="number" {...register('liabilities')} placeholder="20000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Worth</span>
                      <input type="number" {...register('net_worth')} readOnly placeholder="Calculated from assets/liabilities" className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment Knowledge</span>
                      <select {...register('investment_knowledge')} className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="">Select Level</option>
                        <option value="None">None</option>
                        <option value="Limited">Limited</option>
                        <option value="Good">Good</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Tolerance</span>
                      <select {...register('risk_tolerance')} className="w-full mt-1 px-3 py-2">
                        <option value="">Select Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment Objective</span>
                      <select {...register('investment_objective')} className="w-full mt-1 px-3 py-2">
                        <option value="">Select Objective</option>
                        <option value="Safety">Safety</option>
                        <option value="Income">Income</option>
                        <option value="Growth">Growth</option>
                        <option value="Aggressive Growth">Aggressive Growth</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Investments */}
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Investments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Bonds" {...register('investments')} className="rounded" />
                      <span className="text-sm">Bonds</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Segregated Funds" {...register('investments')} className="rounded" />
                      <span className="text-sm">Segregated Funds</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Stocks" {...register('investments')} className="rounded" />
                      <span className="text-sm">Stocks</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Mutual Funds" {...register('investments')} className="rounded" />
                      <span className="text-sm">Mutual Funds</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Term Deposits/GIC" {...register('investments')} className="rounded" />
                      <span className="text-sm">Term Deposits/GIC</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Real Estate & Mortgages" {...register('investments')} className="rounded" />
                      <span className="text-sm">Real Estate & Mortgages</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Other" {...register('investments')} className="rounded" />
                      <span className="text-sm">Other</span>
                    </label>
                  </div>

                  {((watch('investments') || [])).includes('Other') && (
                    <div className="mt-3">
                      <div className="flex gap-2 items-center">
                        <input value={otherInvestmentInput} onChange={(e) => setOtherInvestmentInput(e.target.value)} placeholder="Type investment and press Add" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                        <button type="button" onClick={addOtherInvestment} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {otherInvestments.map(i => (
                          <span key={i} className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full px-3 py-1 text-sm">
                            {i}
                            <button type="button" onClick={() => removeOtherInvestment(i)} className="text-xs text-gray-500 hover:text-gray-700">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Banking, Approval */}
            {currentStep === 3 && (
              <>
                {/* Banking */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Banking Details</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Optional — used for transfers and verification.</p>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Financial Institution Name</span>
                    <input {...register('bank_name')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Transit</span>
                      <input {...register('bank_transit')} className="w-full mt-1 px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Institution</span>
                      <input {...register('bank_institution')} className="w-full mt-1 px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Account</span>
                      <input {...register('bank_account')} className="w-full mt-1 px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>
                  </div>

                  <label className="block md:col-span-2 mt-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</span>
                    <input {...register('bank_address')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">City</span>
                      <input {...register('bank_city')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Province</span>
                      <select {...register('bank_province')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
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
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</span>
                      <input {...register('bank_postal_code')} placeholder="A1A 1A1" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>
                  </div>
                </div>

                {/* Client Approval Documentation */}
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Client Approval Documentation</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Records verifying identity and citizenship.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Driver's License" {...register('approval_documents')} className="rounded" />
                      <span className="text-sm">Driver's License</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Birth Certificate" {...register('approval_documents')} className="rounded" />
                      <span className="text-sm">Birth Certificate</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Passport" {...register('approval_documents')} className="rounded" />
                      <span className="text-sm">Passport</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" value="Other" {...register('approval_documents')} className="rounded" />
                      <span className="text-sm">Other (Specify)</span>
                    </label>
                  </div>

                  {((watch('approval_documents') || [])).includes('Other') && (
                    <div className="mt-3">
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Document(s) (semicolon separated)</span>
                        <input value={approvalOtherText} onChange={(e) => onApprovalOtherChange(e.target.value)} placeholder="e.g. National ID; Local Permit" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Number</span>
                      <input {...register('document_number')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jurisdiction</span>
                      <input {...register('document_jurisdiction')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry</span>
                      <input type="date" {...register('document_expiry')} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                    </label>
                  </div>

                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Citizenship</span>
                    <div className="flex gap-4 mt-2 items-center">
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" value="Canadian" {...register('citizenship')} className="rounded" />
                        <span className="text-sm">Canadian</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" value="U.S." {...register('citizenship')} className="rounded" />
                        <span className="text-sm">U.S.</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" value="Other" {...register('citizenship')} className="rounded" />
                        <span className="text-sm">Other (Specify)</span>
                      </label>
                    </div>
                    {watch('citizenship') === 'Other' && (
                      <div className="mt-2">
                        <input {...register('citizenship_other')} placeholder="Specify citizenship" className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
                      </div>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 mt-4">
                    <input type="checkbox" {...register('id_verified_physical')} />
                    <span className="text-sm">Met Client in Person — I.D. verified physically by Agent</span>
                  </label>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="md:col-span-2 flex justify-between gap-3 mt-6">
              <button type="button" onClick={prevStep} disabled={currentStep === 0} className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              {currentStep < steps.length - 1 ? (
                <button type="button" onClick={nextStep} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md">
                  Next
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center gap-2">
                  {id ? 'Save Changes' : 'Add Client'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
