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

  // 👇 FULL useForm with all hooks needed for KYCForm
  const { register, handleSubmit, reset, setValue, watch, getValues } = useForm();

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

    console.group('🎯 FORM AUTO-FILL DEBUG');
    console.log('👤 Client:', client);
    console.log('📋 Mappings:', fieldMappings);

    // Map client data to PDF fields
    Object.entries(fieldMappings).forEach(([pdfField, clientField]) => {
      const value = client[clientField];
      
      console.group(`🔍 "${pdfField}" ← "${clientField}"`);
      console.log('Value:', value);
      
      if (value !== undefined && value !== null && value !== '') {
        setValue(pdfField, String(value));
        console.log(`✅ SET "${pdfField}" = "${String(value)}"`);
      } else {
        console.log('❌ SKIPPED - empty');
      }
      console.groupEnd();
    });

    // Direct mapping for common fields
    const directFields = [
      'first_name', 'last_name', 'email', 'dob', 'sin', 'address',
      'city', 'province', 'postal_code', 'phone_residence', 
      'phone_business', 'employer', 'occupation', 'net_worth'
    ];

    directFields.forEach((field) => {
      if (client[field] !== undefined && client[field] !== null) {
        setValue(field, String(client[field]));
        console.log(`✅ DIRECT: "${field}" = "${client[field]}"`);
      }
    });

    console.log('🎉 PREFILL COMPLETE');
    console.groupEnd();
  }, [client, selectedTemplate, setValue]);

  // Reset + prefill when template changes
  useEffect(() => {
    if (client && selectedTemplate) {
      reset();
      prefillForm();
    }
  }, [client, selectedTemplate, prefillForm, reset]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

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
    console.group('📤 PDF GENERATION');
    console.log('🔥 FORM DATA (50+ fields):', data);
    
    if (!selectedTemplate?.pdf_url) {
      setError('No PDF template URL');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const pdfBytes = await fillPDF(selectedTemplate.pdf_url, data);
      const filename = `${selectedTemplate.name}_${client?.first_name || 'client'}_${client?.last_name || 'unknown'}.pdf`;
      downloadPDF(pdfBytes, filename);
      console.log(`✅ PDF: ${filename}`);
    } catch (err) {
      console.error('❌ PDF Error:', err);
      setError('PDF generation failed');
    } finally {
      setGenerating(false);
      console.groupEnd();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-CA');
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
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-300">Loading client & templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/agent/clients')}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Form Generator
              </h1>
              {client && (
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {client.first_name} {client.last_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {error && (
          <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <p className="text-lg text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Client & Template */}
          <div className="space-y-6 lg:max-w-md">
            {/* Client Card */}
            {client && (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {client.first_name} {client.last_name}
                    </h2>
                    <p className="text-lg text-primary-600 dark:text-primary-400 font-semibold">
                      {client.email || 'No email'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">DOB</span>
                    <span className="font-semibold">{formatDate(client.dob) || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Net Worth</span>
                    <span className="font-semibold text-green-600">{formatCurrency(client.net_worth) || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 dark:text-gray-400">Risk Tolerance</span>
                    <span className="font-semibold">{client.risk_tolerance || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Form Template
                </h2>
              </div>

              <select
                onChange={handleTemplateChange}
                className="w-full px-5 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-lg font-medium text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <option value="">Choose template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.company})
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <div>
                      <p className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                        {selectedTemplate.name}
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        {selectedTemplate.company}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - FULL KYC FORM */}
          <div className="lg:col-span-2">
            {!selectedTemplate ? (
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-16 text-center border border-white/30 dark:border-gray-700/50">
                <FileText className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Select Form Template
                </h3>
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Choose a template to load the pre-filled form and generate PDF
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {selectedTemplate.name}
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {Object.keys(getValues()).length} fields ready
                  </div>
                </div>

                {/* ✅ FULL KYC EXTENDED FORM */}
                {selectedTemplate.name?.toLowerCase().includes('kyc') ? (
                  <>
                    <div className="mb-8 p-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">✓</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                            KYC Extended Form Loaded (50+ Fields)
                          </h3>
                          <p className="text-emerald-700 dark:text-emerald-300">
                            Personal, Tax, Financial, Investment, ID sections
                          </p>
                        </div>
                      </div>
                    </div>
                    <KYCForm register={register} setValue={setValue} client={client} />
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        {...register('first_name')}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-lg focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        {...register('last_name')}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-lg focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-sm"
                      />
                    </div>
                    {/* Add more generic fields as needed */}
                  </div>
                )}

                {/* Generate Button */}
                <div className="mt-12 pt-10 border-t-4 border-gradient-to-r border-transparent from-primary-500 to-primary-600 bg-gradient-to-r p-1 rounded-3xl">
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full px-12 py-6 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-4 group"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span>Download {selectedTemplate.name} PDF</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Debug Panel */}
                <details className="mt-8 p-6 bg-gray-900/95 backdrop-blur-xl text-white rounded-3xl border border-gray-700 text-sm shadow-2xl">
                  <summary className="cursor-pointer font-bold pb-3 border-b border-gray-700 flex items-center gap-2">
                    🔍 Debug: Form Data ({Object.keys(getValues()).length} fields)
                  </summary>
                  <pre className="mt-4 overflow-auto max-h-80 font-mono text-xs">
                    {JSON.stringify(getValues(), null, 2)}
                  </pre>
                </details>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
