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

  const { register, handleSubmit, reset, setValue, watch, getValues } = useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

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

  // 🔥 LIVE FORM WATCHING
  const formValues = watch();

  useEffect(() => {
    if (formValues) {
      console.group('🔥 LIVE FORM VALUES');
      console.log('📊 Field Count:', Object.keys(formValues).length);
      console.log('👀 Current Values:', formValues);
      console.groupEnd();
    }
  }, [formValues]);

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
    console.group('🚀 FINAL SUBMIT DATA');
    console.log('📋 ALL FIELDS:', data);
    console.groupEnd();
    
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
          <p className="text-xl text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/agent/clients')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Form Generator</h1>
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
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {client && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {client.first_name} {client.last_name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.email || 'No email'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">DOB:</span>
                    <span>{formatDate(client.dob) || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Net Worth:</span>
                    <span>{formatCurrency(client.net_worth) || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Form Template</h2>
              </div>

              <select
                onChange={handleTemplateChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.company})
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    ✅ {selectedTemplate.name} - {selectedTemplate.company}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2">
            {!selectedTemplate ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Form Template</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a template to prefill client data and generate PDF</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{selectedTemplate.name}</h2>

                {/* 🔥 FULL KYC FORM */}
                {selectedTemplate.name?.toLowerCase().includes('kyc') ? (
                  <>
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">✓</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">KYC Extended Form (50+ Fields)</h3>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">Live updates → Console + PDF</p>
                        </div>
                      </div>
                    </div>
                    <KYCForm register={register} setValue={setValue} client={client} />
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input {...register('first_name')} placeholder="First Name" className="w-full p-3 border rounded-lg" />
                    <input {...register('last_name')} placeholder="Last Name" className="w-full p-3 border rounded-lg" />
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6" />
                        Download {selectedTemplate.name} PDF
                      </>
                    )}
                  </button>
                </div>

                {/* 🔥 LIVE DEBUG PANEL */}
                <details className="mt-8 p-6 bg-gradient-to-r from-purple-900/95 to-indigo-900/95 text-white rounded-2xl border border-purple-700 shadow-2xl">
                  <summary className="cursor-pointer font-bold pb-3 border-b border-purple-600 flex items-center gap-3">
                    🔥 LIVE FORM DATA ({Object.keys(formValues || {}).length} fields)
                  </summary>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between bg-purple-800/50 p-3 rounded-lg">
                      <span>Name:</span>
                      <code className="font-mono">{formValues?.first_name || formValues?.firstname || '—'}</code>
                    </div>
                    <div className="flex justify-between bg-purple-800/50 p-3 rounded-lg">
                      <span>SIN:</span>
                      <code className="font-mono">{formValues?.sin || '—'}</code>
                    </div>
                    <div className="flex justify-between bg-purple-800/50 p-3 rounded-lg">
                      <span>Net Worth:</span>
                      <code className="font-mono">{formValues?.net_worth || formValues?.networth || '—'}</code>
                    </div>
                    <pre className="text-xs overflow-auto max-h-48 bg-black/70 p-4 rounded-xl border border-purple-500 mt-4">
                      {JSON.stringify(formValues, null, 2)}
                    </pre>
                  </div>
                </details>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
