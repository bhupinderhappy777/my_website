import { fillPDF } from './pdfGenerator';
import logger from './logger';
import kycFieldMappings from '../data/kyc_field_mappings.json';
import pdfFields from '../data/kyc_pdf_fields.json';

/**
 * Fills a KYC PDF with form data, handling complex field mappings and button logic
 * @param {Object} formData - The form data from react-hook-form
 * @param {string[]} otherCountries - Array of additional countries of residence
 * @param {string[]} otherInvestments - Array of additional investment types
 * @param {string} pdfUrl - URL of the PDF template
 * @param {Object} options - Additional options for storage and metadata
 * @param {Object} options.supabase - Supabase client for storage upload
 * @param {string} options.clientId - Client ID for storage path
 * @param {string} options.formId - Form record ID for event logging
 * @param {string} options.actorId - User ID for event loggingblob:https://humble-space-zebra-g4v6g7j6q9q36v6-5173.app.github.dev/c3422de6-23f5-4c67-8a1e-ea1b13af963d
 * @returns {Promise<{pdfBytes: Uint8Array, storagePath?: string}>} - PDF bytes and optional storage path
 */
export async function fillKYCPDF(formData, otherCountries = [], otherInvestments = [], pdfUrl, options = {}) {
  if (!pdfUrl) {
    throw new Error('KYC PDF template URL not available');
  }

  logger.info('Starting KYC PDF fill process', {
    hasFormData: !!formData,
    otherCountriesCount: otherCountries.length,
    otherInvestmentsCount: otherInvestments.length
  });

  const bucketAnnualIncome = (val) => {
    if (val === undefined || val === null) return val;
    // If already a mapped label, keep it
    if (typeof val === 'string' && kycFieldMappings?.annual_income?.value_map?.[val]) return val;
    const num = Number(val);
    if (!Number.isFinite(num)) return val;
    if (num < 25000) return '<$25,000';
    if (num < 50000) return '$25,000-$49,999';
    if (num < 75000) return '$50,000-$74,999';
    if (num < 100000) return '$75,000-$99,999';
    if (num < 125000) return '$100,000-$124,999';
    if (num < 200000) return '$125,000-$199,999';
    if (num < 1000000) return '$200,000-$999,999';
    return '$1M+';
  };

  // Normalize annual income to the bucketed label expected by the PDF mapping
  const normalizedFormData = {
    ...formData,
    annual_income: bucketAnnualIncome(formData?.annual_income)
  };

  // Build pdfData mapping form data to PDF field names using kycFieldMappings
  const pdfData = {};

  // Map logical fields to PDF fields with KYC-specific logic
  Object.entries(kycFieldMappings).forEach(([logicalField, mapping]) => {
    if (!mapping || typeof mapping !== 'object' || !mapping.pdf_field) return;

    const pdfName = mapping.pdf_field;
    const val = normalizedFormData[logicalField];

    if (val === undefined || val === null) return;

    if (mapping.type === 'checkbox') {
      // Handle checkbox fields - map to On/Off or custom values
      pdfData[pdfName] = val ? (mapping.checked_value || 'On') : (mapping.unchecked_value || 'Off');
    } else if (mapping.type === 'radio_group' && mapping.value_map) {
      // Handle radio groups with value mapping
      const mapped = mapping.value_map[String(val)] || String(val);

      // If mapped value matches a Btn PDF field, set that Btn to On
      const isBtn = pdfFields.find((f) => f.name === mapped && f.type === 'Btn');
      if (isBtn) {
        pdfData[mapped] = mapping.checked_value || 'On';
      } else {
        // Otherwise set the radio group field name to the mapped value
        pdfData[pdfName] = mapped;
      }
      // Also set the group value to On for radios that may not register as Btn in pdfFields
      // (helps when pdfFields metadata is incomplete or misclassified)
      if (!isBtn) {
        pdfData[mapped] = mapping.checked_value || 'On';
      }
    } else if (mapping.type === 'array') {
      // Handle array fields (like other_countries, other_investments)
      if (Array.isArray(val) && val.length > 0) {
        pdfData[pdfName] = val.join(', ');
      } else if (val && typeof val === 'string') {
        pdfData[pdfName] = val;
      }
    } else {
      // Handle text and other field types
      pdfData[pdfName] = String(val);
    }
  });

  // Handle special KYC-specific field logic

  // Title field - handle radio button selection
  if (normalizedFormData.title) {
    const titleMapping = kycFieldMappings.title;
    if (titleMapping && titleMapping.value_map) {
      const mappedTitle = titleMapping.value_map[normalizedFormData.title];
      if (mappedTitle) {
        pdfData[mappedTitle] = 'On'; // Set the corresponding button to On
      }
    }
  }

  // Annual income - explicitly toggle mapped radio button
  if (normalizedFormData.annual_income) {
    const m = kycFieldMappings.annual_income;
    if (m && m.value_map) {
      const mapped = m.value_map[String(normalizedFormData.annual_income)] || String(normalizedFormData.annual_income);
      pdfData[mapped] = m.checked_value || 'On';
      pdfData[m.pdf_field] = mapped;
    }
  }

  // Joint annual income - explicitly toggle mapped radio button
  if (normalizedFormData.joint_annual_income) {
    const m = kycFieldMappings.joint_annual_income;
    if (m && m.value_map) {
      const mapped = m.value_map[String(normalizedFormData.joint_annual_income)] || String(normalizedFormData.joint_annual_income);
      pdfData[mapped] = m.checked_value || 'On';
      pdfData[m.pdf_field] = mapped;
    }
  }

  // Language preference - handle radio buttons
  if (normalizedFormData.language_preference) {
    const langMapping = kycFieldMappings.language_preference;
    if (langMapping && langMapping.value_map) {
      const mappedLang = langMapping.value_map[normalizedFormData.language_preference];
      if (mappedLang) {
        pdfData[mappedLang] = 'On';
      }
    }
  }

  // Account type - handle radio buttons
  if (normalizedFormData.account_type) {
    const accountMapping = kycFieldMappings.account_type;
    if (accountMapping && accountMapping.value_map) {
      const mappedAccount = accountMapping.value_map[normalizedFormData.account_type];
      if (mappedAccount) {
        pdfData[mappedAccount] = 'On';
      }
    }
  }

  // Plan status - handle radio buttons
  if (normalizedFormData.plan_status) {
    const planMapping = kycFieldMappings.plan_status;
    if (planMapping && planMapping.value_map) {
      const mappedPlan = planMapping.value_map[normalizedFormData.plan_status];
      if (mappedPlan) {
        pdfData[mappedPlan] = 'On';
      }
    }
  }

  // Plan type - handle radio buttons
  if (normalizedFormData.plan_type) {
    const planTypeMapping = kycFieldMappings.plan_type;
    if (planTypeMapping && planTypeMapping.value_map) {
      const mappedPlanType = planTypeMapping.value_map[normalizedFormData.plan_type];
      if (mappedPlanType) {
        pdfData[mappedPlanType] = 'On';
      }
    }
  }

  // Time horizon - handle radio buttons
  if (normalizedFormData.time_horizon) {
    const timeMapping = kycFieldMappings.time_horizon;
    if (timeMapping && timeMapping.value_map) {
      const mappedTime = timeMapping.value_map[normalizedFormData.time_horizon];
      if (mappedTime) {
        pdfData[mappedTime] = 'On';
      }
    }
  }

  // Investment purpose - handle radio buttons
  if (normalizedFormData.investment_purpose) {
    const purposeMapping = kycFieldMappings.investment_purpose;
    if (purposeMapping && purposeMapping.value_map) {
      const mappedPurpose = purposeMapping.value_map[normalizedFormData.investment_purpose];
      if (mappedPurpose) {
        pdfData[mappedPurpose] = 'On';
      }
    }
  }

  // Citizenship - handle radio buttons
  if (normalizedFormData.citizenship) {
    const citizenshipMapping = kycFieldMappings.citizenship;
    if (citizenshipMapping) {
      if (normalizedFormData.citizenship === 'Canadian') {
        pdfData['Canadian'] = 'On';
      } else if (normalizedFormData.citizenship === 'Permanent Resident') {
        pdfData['Permanent Resident'] = 'On';
      } else if (normalizedFormData.citizenship === 'Other') {
        pdfData['Other'] = 'On';
      }
    }
  }

  // Handle investment holdings checkboxes
  const holdingsFields = [
    'holdings_bonds',
    'holdings_stocks',
    'holdings_mutual_funds',
    'holdings_etfs',
    'holdings_gics',
    'holdings_real_estate'
  ];

  holdingsFields.forEach(field => {
    if (normalizedFormData[field]) {
      const mapping = kycFieldMappings[field];
      if (mapping) {
        pdfData[mapping.pdf_field] = 'On';
      }
    }
  });

  // Handle approval documents checkboxes
  if (normalizedFormData.approval_documents && Array.isArray(normalizedFormData.approval_documents)) {
    normalizedFormData.approval_documents.forEach(doc => {
      if (doc === "Driver's License") {
        pdfData["Drivers License"] = 'On';
      } else if (doc === 'Birth Certificate') {
        pdfData['Birth Certificate'] = 'On';
      } else if (doc === 'Passport') {
        pdfData['Passport'] = 'On';
      } else if (doc === 'Other') {
        pdfData['Other_2'] = 'On';
      }
    });
  }

  // Handle tax residency checkboxes
  if (normalizedFormData.tax_residency && Array.isArray(normalizedFormData.tax_residency)) {
    if (normalizedFormData.tax_residency.includes('Canada')) {
      pdfData['Tax Resident Canada'] = 'On';
    }
    if (normalizedFormData.tax_residency.includes('US')) {
      pdfData['Tax Resident US'] = 'On';
    }
    if (normalizedFormData.tax_residency.includes('Other')) {
      pdfData['Other_3'] = 'On';
    }
  }

  // Handle dynamic arrays
  if (otherCountries.length > 0) {
    // Try to find a field for additional countries
    const countryField = pdfFields.find(f => f.name.toLowerCase().includes('country') && f.name.toLowerCase().includes('other'));
    if (countryField) {
      pdfData[countryField.name] = otherCountries.join(', ');
    } else {
      // Fallback: add to a generic "other" field if it exists
      const otherField = pdfFields.find(f => f.name.toLowerCase().includes('other') && f.type === 'Tx');
      if (otherField) {
        pdfData[otherField.name] = `Additional countries: ${otherCountries.join(', ')}`;
      }
    }
  }

  if (otherInvestments.length > 0) {
    // Try to find a field for additional investments
    const investmentField = pdfFields.find(f => f.name.toLowerCase().includes('investment') && f.name.toLowerCase().includes('other'));
    if (investmentField) {
      pdfData[investmentField.name] = otherInvestments.join(', ');
    } else {
      // Fallback: add to a generic "other" field if it exists
      const otherField = pdfFields.find(f => f.name.toLowerCase().includes('other') && f.type === 'Tx');
      if (otherField && !pdfData[otherField.name]) {
        pdfData[otherField.name] = `Additional investments: ${otherInvestments.join(', ')}`;
      }
    }
  }

  // Include any raw PDF-named fields submitted directly by the form
  Object.entries(normalizedFormData).forEach(([k, v]) => {
    if (pdfData[k] === undefined) {
      pdfData[k] = v;
    }
  });

  logger.debug('Final KYC pdfData prepared', { fieldCount: Object.keys(pdfData).length });

  // Fill the PDF with the mapped data
  const pdfBytes = await fillPDF(pdfUrl, pdfData);

  logger.info('KYC PDF filled successfully', { pdfSize: pdfBytes.length });

  // Upload to storage if supabase client provided
  let storagePath = null;
  if (options.supabase && options.clientId) {
    try {
      const clientName = formData.first_name && formData.last_name
        ? `${formData.first_name}_${formData.last_name}`
        : `Client_${options.clientId}`;
      const filename = `KYC_${clientName}_${new Date().toISOString().split('T')[0]}.pdf`;
      storagePath = `kyc/${options.clientId}/${filename}`;

      const { error: uploadError } = await options.supabase.storage
        .from('generated-pdfs')
        .upload(storagePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        logger.error('Failed to upload PDF to storage', { error: uploadError });
        throw uploadError;
      }

      logger.info('PDF uploaded to storage', { storagePath });

      // Log event if formId provided
      if (options.formId && options.actorId) {
        const { error: eventError } = await options.supabase
          .from('form_events')
          .insert([{
            form_id: options.formId,
            event_type: 'pdf_generated',
            actor_id: options.actorId,
            payload: {
              storage_path: storagePath,
              filename,
              pdf_size: pdfBytes.length,
              generated_at: new Date().toISOString()
            }
          }]);

        if (eventError) {
          logger.warn('Failed to log PDF generation event', { error: eventError });
        } else {
          logger.info('PDF generation event logged');
        }
      }
    } catch (storageError) {
      logger.error('Storage upload failed, continuing with download-only', { error: storageError });
      // Don't throw - still allow download even if storage fails
    }
  }

  return { pdfBytes, storagePath };
}

/**
 * Gets a signed URL for downloading a PDF from the private storage bucket
 * @param {Object} supabase - Supabase client
 * @param {string} storagePath - Path to the PDF in storage (e.g., 'kyc/clientId/filename.pdf')
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Signed URL for download
 */
export async function getPDFDownloadUrl(supabase, storagePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from('generated-pdfs')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      logger.error('Failed to create signed URL', { error, storagePath });
      throw error;
    }

    logger.info('Signed URL created', { storagePath, expiresIn });
    return data.signedUrl;
  } catch (err) {
    logger.error('Error creating signed URL', { error: err, storagePath });
    throw err;
  }
}