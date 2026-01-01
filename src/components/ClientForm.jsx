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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStep ? 'bg-green-600 text-white' : 
                    index === currentStep ? 'bg-indigo-600 text-white' : 
                    'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 transition-colors ${
                      index < currentStep ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{steps[currentStep].title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{steps[currentStep].description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 0: Personal & Contact, Tax Residency */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {/* Personal / Contact */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
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

                {/* Tax Residency */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tax Residency</h3>
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
              </div>
            )}

            {/* Step 1: Address, Employment */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Address */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address Information</h3>
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

                {/* Employment */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employment Information</h3>
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
              </div>
            )}

            {/* Step 2: Financial, Investments */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Financial */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Information</h3>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Tolerance</label>
                      <select {...register('risk_tolerance')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="">Select Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Investment Objective</label>
                      <select {...register('investment_objective')} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition">
                        <option value="">Select Objective</option>
                        <option value="Safety">Safety</option>
                        <option value="Income">Income</option>
                        <option value="Growth">Growth</option>
                        <option value="Aggressive Growth">Aggressive Growth</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Investments */}
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Investment Types</h3>
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
              </div>
            )}

            {/* Step 3: Banking, Approval */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Banking */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Banking Details</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Optional — used for transfers and verification.</p>
                  
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Client Approval Documentation</h3>
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
              </div>
            )}
          </form>

          {/* Actions - Outside the form */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={prevStep} 
              disabled={currentStep === 0} 
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition"
            >
              ← Previous
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
            
            {currentStep < steps.length - 1 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Next →
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit(onSubmit)} 
                disabled={isSubmitting} 
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : (id ? 'Save Changes' : 'Create Client')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
