import { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSupabaseClient, useSession } from '../AuthContext';
import {
  ArrowLeft,
  Plus,
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

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
      if (error) return;
      if (mounted) {
        // If tax_residency stored as array, split into standard and other countries
        if (data && data.tax_residency) {
          const arr = Array.isArray(data.tax_residency) ? data.tax_residency : (typeof data.tax_residency === 'string' ? [data.tax_residency] : []);
          const hasCanada = arr.includes('Canada');
          const hasUSA = arr.includes('USA');
          const others = arr.filter(x => x !== 'Canada' && x !== 'USA');
          // Prefer Canada, then USA, then Other
          if (hasCanada) {
            reset({ ...data, tax_residency: 'Canada' });
            setOtherCountries(others);
          } else if (hasUSA) {
            reset({ ...data, tax_residency: 'USA' });
            setOtherCountries(others);
          } else if (others.length) {
            reset({ ...data, tax_residency: 'Other' });
            setOtherCountries(others);
          } else {
            reset(data);
          }
        }

        // If investments stored as array, load selected standard investments and other investments
        if (data && data.investments) {
          const iarr = Array.isArray(data.investments) ? data.investments : (typeof data.investments === 'string' ? [data.investments] : []);
          const standardInvestments = ['Bonds','Segregated Funds','Stocks','Mutual Funds','Term Deposits/GIC','Real Estate & Mortgages'];
          const std = iarr.filter(i => standardInvestments.includes(i));
          const othersInv = iarr.filter(i => !standardInvestments.includes(i));
          if (std.length || othersInv.length) {
            setValue('investments', std.concat(othersInv.length ? ['Other'] : []));
            setOtherInvestments(othersInv);
          }
        } else {
          reset(data);
        }
      }
    })();
    return () => { mounted = false; };
  }, [id, reset, supabase]);

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
    try {
      // normalize tax_residency into an array of strings for Supabase
      const rawResidency = formData.tax_residency ?? 'Canada';
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
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        net_worth: formData.net_worth ? parseFloat(formData.net_worth) : null,
        liquid_assets: formData.liquid_assets ? parseFloat(formData.liquid_assets) : null,
        fixed_assets: formData.fixed_assets ? parseFloat(formData.fixed_assets) : null,
        liabilities: formData.liabilities ? parseFloat(formData.liabilities) : null,
      };

      if (id) {
        await supabase.from('clients').update(payload).eq('id', id);
      } else {
        await supabase.from('clients').insert([payload]);
      }
      navigate('/agent/clients');
    } catch (e) {
      // minimal error handling here
      // in UI could show an alert
      // console.error(e);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ring-1 ring-gray-100 dark:ring-0">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/agent/clients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{id ? 'Edit Client' : 'Add Client'}</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reuse same fields as modal; keep layout clear and grouped */}
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

            <label className="block">
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax Residency</span>
              <select {...register('tax_residency')} multiple className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition h-28">
                <option value="Canada">Canada</option>
                <option value="USA">USA</option>
                <option value="Other">Other</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd (or use checkboxes) to multi-select. Select "Other" to add custom countries.</p>
            </label>

            {((watch('tax_residency') || [])).includes('Other') && (
              <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</h3>
            </div>

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

            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Employment</h3>
            </div>

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

            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Financial Information</h3>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Income</span>
              <input type="number" {...register('annual_income')} placeholder="75000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fixed Assets</span>
              <input type="number" {...register('fixed_assets')} placeholder="100000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Worth</span>
              <input type="number" {...register('net_worth')} readOnly placeholder="Calculated from assets/liabilities" className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Liquid Assets</span>
              <input type="number" {...register('liquid_assets')} placeholder="50000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Liabilities</span>
              <input type="number" {...register('liabilities')} placeholder="20000" className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 transition" />
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

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment Objective</span>
              <select {...register('investment_objective')} className="w-full mt-1 px-3 py-2">
                <option value="">Select Objective</option>
                <option value="Safety">Safety</option>
                <option value="Income">Income</option>
                <option value="Growth">Growth</option>
                <option value="Aggressive Growth">Aggressive Growth</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Other Investments</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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

            <div className="md:col-span-2 flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => navigate('/agent/clients')} className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center gap-2">
                {id ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
