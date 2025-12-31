import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSupabaseClient, useSession } from '../AuthContext';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  FileText,
  Download,
  AlertCircle,
  User,
  Loader2,
} from 'lucide-react';
import { fillPDF, downloadPDF } from '../utils/pdfGenerator';
import KYCForm from './KYCForm';

export default function FormGenerator() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const session = useSession();

  const [client, setClient] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch client data
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) {
      setError('Client not found');
      setLoading(false);
      return;
    }

    setClient(clientData);

    // Fetch form templates
    const { data: templateData, error: templateError } = await supabase
      .from('form_templates')
      .select('*');

    if (templateError) {
      setError('Failed to load form templates');
    } else {
      setTemplates(templateData || []);
    }

    setLoading(false);
  }, [clientId, supabase]);

  const prefillForm = useCallback(() => {
    if (!client || !selectedTemplate) return;

    const fieldMappings = selectedTemplate.field_mappings || {};

    // Map client data to form fields based on template mappings
    Object.entries(fieldMappings).forEach(([pdfField, clientField]) => {
      if (client[clientField] !== undefined && client[clientField] !== null) {
        setValue(pdfField, String(client[clientField]));
      }
    });

    // Also set common fields directly if no mapping exists
    const directFields = [
      'first_name',
      'last_name',
      'email',
      'dob',
      'sin',
      'address',
      'city',
      'province',
      'postal_code',
      'phone_residence',
      'phone_business',
      'employer',
      'occupation',
      'annual_income',
      'net_worth',
      'liquid_assets',
      'investment_knowledge',
      'risk_tolerance',
      'investment_objective',
    ];

    directFields.forEach((field) => {
      if (client[field] !== undefined && client[field] !== null) {
        setValue(field, String(client[field]));
      }
    });
  }, [client, selectedTemplate, setValue]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  useEffect(() => {
    if (client && selectedTemplate) {
      prefillForm();
    }
  }, [client, selectedTemplate, prefillForm]);

  // Redirect if not logged in (must be after all hooks)
  if (!session) {
    return <Navigate to="/agent/login" replace />;
  }

const handleTemplateChange = (e) => {
  const templateId = e.target.value;
  const template = templates.find((t) => t.id === templateId);
  setSelectedTemplate(template || null);
  reset();
};

  const onSubmit = async (data) => {
    if (!selectedTemplate?.pdf_url) {
      setError('No PDF template URL configured for this form');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const pdfBytes = await fillPDF(selectedTemplate.pdf_url, data);
      const filename = `${selectedTemplate.name}_${client.first_name}_${client.last_name}.pdf`;
      downloadPDF(pdfBytes, filename);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA');
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/agent/clients')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Form Generator
              </h1>
              {client && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Client: {client.first_name} {client.last_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client Info & Template Selection */}
          <div className="space-y-6">
            {/* Client Card */}
            {client && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {client.first_name} {client.last_name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {client.email || 'No email'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      DOB:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(client.dob) || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Net Worth:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatCurrency(client.net_worth) || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Risk Tolerance:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {client.risk_tolerance || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Objective:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {client.investment_objective || '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Select Form Template
                </h2>
              </div>

              <select
                onChange={handleTemplateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.company && `(${template.company})`}
                  </option>
                ))}
              </select>

              {console.log('🔍 Current selectedTemplate state:', selectedTemplate)}
              {selectedTemplate && console.log('🔍 Template IS selected, form should show')}

              {selectedTemplate && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Company:</strong> {selectedTemplate.company || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2">
            {!selectedTemplate ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center transition-colors duration-300">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Form Template
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a form template from the dropdown to prefill client
                  data and generate a PDF.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 transition-colors duration-300"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {selectedTemplate.name}
                </h2>

                {/* Check if this is a KYC form template */}
                {selectedTemplate.name && selectedTemplate.name.toLowerCase().includes('kyc') ? (
                  <KYCForm register={register} setValue={setValue} client={client} />
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Information */}
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Personal Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      {...register('first_name')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      {...register('last_name')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register('dob')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      SIN
                    </label>
                    <input
                      {...register('sin')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Residence Phone
                    </label>
                    <input
                      {...register('phone_residence')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Business Phone
                    </label>
                    <input
                      {...register('phone_business')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Address
                    </h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address
                    </label>
                    <input
                      {...register('address')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      {...register('city')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Province
                    </label>
                    <input
                      {...register('province')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Postal Code
                    </label>
                    <input
                      {...register('postal_code')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  {/* Employment */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Employment
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employer
                    </label>
                    <input
                      {...register('employer')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Occupation
                    </label>
                    <input
                      {...register('occupation')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  {/* Financial Information */}
                  <div className="md:col-span-2 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      Financial Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Annual Income
                    </label>
                    <input
                      {...register('annual_income')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Net Worth
                    </label>
                    <input
                      {...register('net_worth')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Liquid Assets
                    </label>
                    <input
                      {...register('liquid_assets')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Investment Knowledge
                    </label>
                    <select
                      {...register('investment_knowledge')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    >
                      <option value="">Select Level</option>
                      <option value="None">None</option>
                      <option value="Limited">Limited</option>
                      <option value="Good">Good</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Risk Tolerance
                    </label>
                    <select
                      {...register('risk_tolerance')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    >
                      <option value="">Select Level</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Investment Objective
                    </label>
                    <select
                      {...register('investment_objective')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
                    >
                      <option value="">Select Objective</option>
                      <option value="Safety">Safety</option>
                      <option value="Income">Income</option>
                      <option value="Growth">Growth</option>
                      <option value="Aggressive Growth">Aggressive Growth</option>
                    </select>
                  </div>
                </div>
                )}

                {/* Generate Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Generate PDF
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
