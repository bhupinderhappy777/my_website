import { PDFDocument } from 'pdf-lib';

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
  console.log('🔍 PDF has', fields.length, 'form fields');
  fields.forEach(field => {
    console.log('Field name:', field.getName(), 'Type:', field.constructor.name);
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

    console.log(`Field ${key} not set (no matching field type)`);
  });

  try {
    pdfDoc.flatten();
  } catch {
    console.log('Could not flatten PDF (likely encrypted), skipping flatten');
  }
  return await pdfDoc.save();
}

export function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
