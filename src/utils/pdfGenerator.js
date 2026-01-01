import { PDFDocument } from 'pdf-lib';
import logger from './logger';

export async function fillPDF(templateUrl, formData) {
  let response;
  try {
    response = await fetch(templateUrl);
  } catch (networkError) {
    throw new Error(
      `Failed to fetch PDF template: Network error - ${networkError.message}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PDF template: HTTP ${response.status} ${response.statusText}`
    );
  }

  const existingPdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  
  // Debug: Check what fields exist
  const fields = form.getFields();
  logger.info('PDF template loaded', { templateUrl, fieldCount: fields.length });
  fields.forEach((field) => {
    try {
      logger.debug('PDF field', { name: field.getName(), type: field.constructor.name });
    } catch (e) {
      logger.debug('PDF field (unreadable)', { err: e && e.message });
    }
  });

  Object.entries(formData).forEach(([key, value]) => {
    // Try text field
    try {
      const textField = form.getTextField(key);
      textField.setText(String(value || ''));
      return;
    } catch (e) {
      // not a text field
    }

    // Try checkbox/radio button
    try {
      const checkBox = form.getCheckBox(key);
      if (value === true || value === 'On' || value === 'Yes' || value === '1') {
        checkBox.check();
      } else {
        try { checkBox.uncheck(); } catch {}
      }
      return;
    } catch (e) {
      // not a checkbox
    }

    // Try radio group
    try {
      const radioGroup = form.getRadioGroup(key);
      if (value) {
        try { radioGroup.select(String(value)); } catch {}
      }
      return;
    } catch (e) {
      // not a radio group
    }

    logger.debug(`Field not set`, { field: key, value });
  });

  try {
    pdfDoc.flatten();
  } catch (e) {
    logger.warn('Could not flatten PDF (possible encryption)', { message: e && e.message });
  }
  return await pdfDoc.save();
}

export function downloadPDF(pdfBytes, filename) {
  logger.info('Initiating PDF download', { filename });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
    logger.info('Download triggered', { filename });
  } catch (e) {
    logger.error('Download failed to trigger', { filename, message: e && e.message });
  }
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
