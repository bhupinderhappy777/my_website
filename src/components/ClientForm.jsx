import { useEffect } from 'react';
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

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
      if (error) return;
      if (mounted) reset(data);
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
      if (id) {
        await supabase.from('clients').update({
          ...formData,
          annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
          net_worth: formData.net_worth ? parseFloat(formData.net_worth) : null,
          liquid_assets: formData.liquid_assets ? parseFloat(formData.liquid_assets) : null,
          fixed_assets: formData.fixed_assets ? parseFloat(formData.fixed_assets) : null,
          liabilities: formData.liabilities ? parseFloat(formData.liabilities) : null,
        }).eq('id', id);
      } else {
        await supabase.from('clients').insert([{
          ...formData,
          annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
          net_worth: formData.net_worth ? parseFloat(formData.net_worth) : null,
          liquid_assets: formData.liquid_assets ? parseFloat(formData.liquid_assets) : null,
          fixed_assets: formData.fixed_assets ? parseFloat(formData.fixed_assets) : null,
          liabilities: formData.liabilities ? parseFloat(formData.liabilities) : null,
        }]);
      }
      navigate('/agent/clients');
    } catch (e) {
      // minimal error handling here
      // in UI could show an alert
      // console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/agent/clients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{id ? 'Edit Client' : 'Add Client'}</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reuse same fields as modal; keep layout clear and grouped */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</span>
              <select {...register('title')} className="w-full mt-1">
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
              <input {...register('first_name', { required: true })} className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</span>
              <input {...register('last_name', { required: true })} className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
              <input type="email" {...register('email')} className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Language</span>
              <select {...register('language_preference')} defaultValue="English" className="w-full mt-1 px-3 py-2">
                <option value="English">English</option>
                <option value="French">French</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</span>
              <input type="date" {...register('dob')} className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SIN</span>
              <input {...register('sin')} placeholder="XXX-XXX-XXX" className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Residence Phone</span>
              <input {...register('phone_residence')} className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Phone</span>
              <input {...register('phone_business')} className="w-full mt-1 px-3 py-2" />
            </label>

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</h3>
            </div>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</span>
              <input {...register('address')} className="w-full mt-1 px-3 py-2" />
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
              <input {...register('employer')} className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employer Address</span>
              <input {...register('employer_address')} placeholder="Employer full address" className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Occupation</span>
              <input {...register('occupation')} className="w-full mt-1 px-3 py-2" />
            </label>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Financial Information</h3>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Income</span>
              <input type="number" {...register('annual_income')} placeholder="75000" className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fixed Assets</span>
              <input type="number" {...register('fixed_assets')} placeholder="100000" className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Worth</span>
              <input type="number" {...register('net_worth')} readOnly placeholder="Calculated from assets/liabilities" className="w-full mt-1 px-3 py-2 bg-gray-50" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Liquid Assets</span>
              <input type="number" {...register('liquid_assets')} placeholder="50000" className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Liabilities</span>
              <input type="number" {...register('liabilities')} placeholder="20000" className="w-full mt-1 px-3 py-2" />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment Knowledge</span>
              <select {...register('investment_knowledge')} className="w-full mt-1 px-3 py-2">
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

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => navigate('/agent/clients')} className="px-6 py-2 border rounded-xl">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary-600 text-white rounded-xl">
                {id ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
