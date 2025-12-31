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

  // 👇 FIXED: useForm with watch() to capture ALL changes
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
    console.log('👤 Client data:', client);
    console.log('📋 Field mappings:', fieldMappings);

    // 👇 FIXED: Map client data to form fields
    Object.entries(fieldMappings).forEach(([pdfField, clientField]) => {
      const value = client[clientField];
      
      console.group(`🔍 Mapping "${pdfField}" ← "${clientField}"`);
      console.log('Raw Value:', value);
      
      if (value !== undefined && value !== null && value !== '') {
        setValue(pdfField, String(value));
        console.log(`✅ SET "${pdfField}" = "${String(value)}"`);
      } else {
        console.log('❌ SKIPPED - empty');
      }
      console.groupEnd();
    });

    console.log('🎉 AUTO-FILL COMPLETE');
    console.groupEnd();
  }, [client, selectedTemplate, setValue]);

  // 👇 FIXED: Reset + prefill when template changes
  useEffect(() => {
    if (client && selectedTemplate) {
      reset(); // Clear form first
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
    reset(); // 👇 FIXED: Reset form when changing templates
  };

  // 👇 FIXED: onSubmit uses CURRENT form values (getValues/watch)
  const onSubmit = async (data) => {
    console.group('📤 PDF GENERATION DEBUG');
    console.log('🔥 CURRENT FORM DATA (includes changes):', data);
    console.log('📄 Template:', selectedTemplate);
    
    if (!selectedTemplate?.pdf_url) {
      setError('No PDF template URL configured');
      console.groupEnd();
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // 👇 USES CURRENT FORM DATA (your changes + prefilled)
      const pdfBytes = await fillPDF(selectedTemplate.pdf_url, data);
      const filename = `${selectedTemplate.name}_${client?.first_name || 'client'}_${client?.last_name || 'unknown'}.pdf`;
      downloadPDF(pdfBytes, filename);
      console.log(`✅ PDF Downloaded: ${filename}`);
    } catch (err) {
      console.error('❌ PDF Error:', err);
      setError('Failed to generate PDF');
    } finally {
      setGenerating(false);
      console.groupEnd();
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
          {/* Left Column */}
          <div className="space-y-6">
            {/* Client Card */}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {client.email || 'No email'}
                    </p>
                  </div>
                </div>
                {/* Client details */}
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

            {/* Template Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Select Form Template
                </h2>
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
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <p className="text-sm font-medium">
                    <strong>{selectedTemplate.name}</strong> - {selectedTemplate.company}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - DYNAMIC FORM */}
          <div className="lg:col-span-2">
            {!selectedTemplate ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a Form Template
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose from the dropdown to prefill client data
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {selectedTemplate.name} - Edit & Generate
                </h2>

                {/* 👇 DYNAMIC FORM - ALL REGISTERED FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-h-96 overflow-y-auto p-2">
                  {/* Personal Info */}
                  <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold mb-3">Personal Information</h3>
                    
                    <input {...register('first_name')} placeholder="First Name" className="w-full p-3 border rounded-lg mb-3" />
                    <input {...register('last_name')} placeholder="Last Name" className="w-full p-3 border rounded-lg mb-3 md:mr-2" />
                    <input {...register('sin')} placeholder="SIN" className="w-full p-3 border rounded-lg mb-3" />
                    <input type="date" {...register('dob')} className="w-full p-3 border rounded-lg mb-3" />
                  </div>

                  {/* Contact */}
                  <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-semibold mb-3">Contact</h3>
                    <input {...register('email')} type="email" placeholder="Email" className="w-full p-3 border rounded-lg mb-3" />
                    <input {...register('phone_residence')} placeholder="Phone Residence" className="w-full p-3 border rounded-lg mb-3 md:mr-2" />
                    <input {...register('phone_business')} placeholder="Phone Business" className="w-full p-3 border rounded-lg mb-3" />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h3 className="font-semibold mb-3">Address</h3>
                    <input {...register('address')} placeholder="Street Address" className="w-full p-3 border rounded-lg mb-3" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <input {...register('city')} placeholder="City" className="p-3 border rounded-lg" />
                      <input {...register('province')} placeholder="Province" className="p-3 border rounded-lg" />
                      <input {...register('postal_code')} placeholder="Postal Code" className="p-3 border rounded-lg" />
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <h3 className="font-semibold mb-3">Financial Information</h3>
                    <input {...register('net_worth')} placeholder="Net Worth" className="w-full p-3 border rounded-lg mb-3" />
                    <input {...register('liquid_assets')} type="number" placeholder="Liquid Assets" className="w-full p-3 border rounded-lg mb-3" />
                    <input {...register('annual_income')} placeholder="Annual Income" className="w-full p-3 border rounded-lg" />
                  </div>
                </div>

                {/* 👇 GENERATE BUTTON - Uses ALL form changes */}
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-2xl shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 text-lg"
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

                {/* 👇 DEBUG INFO */}
                <details className="mt-4 p-4 bg-gray-900 text-white rounded-xl text-xs">
                  <summary>Debug Form Data (click to expand)</summary>
                  <pre>{JSON.stringify(getValues(), null, 2)}</pre>
                </details>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
